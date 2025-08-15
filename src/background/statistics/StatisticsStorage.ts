/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
import throttle from 'lodash/throttle';
import { utc } from '@date-fns/utc';
import { isSameHour } from 'date-fns/isSameHour';

import { ONE_DAY_MS } from '../../common/constants';
import { log } from '../../common/logger';
import { type StorageInterface } from '../browserApi/storage';
import { notifier } from '../../common/notifier';

import { cropTimestampMinutes, dateToKey, keyToDate } from './utils';
import {
    type AddStatisticsDataTraffic,
    type StatisticsLocationData,
    type StatisticsDataTuple,
    type Statistics,
} from './statisticsTypes';

/**
 * Statistics storage interface.
 */
export interface StatisticsStorageInterface {
    /**
     * Initializes the statistics provider.
     */
    init(): Promise<void>;

    /**
     * Adds traffic statistics.
     *
     * @param locationId Location ID to add traffic for.
     * @param data Traffic data to add.
     */
    addTraffic(locationId: string, data: AddStatisticsDataTraffic): Promise<void>;

    /**
     * Starts tracking connection duration.
     *
     * @param locationId Location ID to start tracking duration for.
     */
    startDuration(locationId: string): Promise<void>;

    /**
     * Updates tracking data of connection duration.
     *
     * @param locationId Location ID to update tracking duration for.
     */
    updateDuration(locationId: string): Promise<void>;

    /**
     * Ends tracking connection duration.
     *
     * @param locationId Location ID to end tracking duration for.
     */
    endDuration(locationId: string): Promise<void>;

    /**
     * Gets statistics data.
     *
     * @returns Statistics data.
     */
    getStatistics(): Promise<Statistics>;

    /**
     * Clears all statistics.
     */
    clearStatistics(): Promise<void>;
}

/**
 * Constructor parameters for {@link StatisticsStorage}.
 */
export interface StatisticsStorageParameters {
    /**
     * Browser local storage.
     */
    storage: StorageInterface;
}

/**
 * Statistics storage.
 * This class is responsible for storing and managing statistics data.
 * It uses browser local storage to persist data.
 *
 * It stores statistics in the following format:
 * - Root object contains locations storage and started timestamp.
 *   - Started timestamp is used to track when the statistics collection started.
 *     It will reset when user clears the statistics.
 *   - Locations storage contains location IDs as keys, location data as values.
 *     - Location data contains hourly, total statistics, sessions, total duration and optional last session.
 *       - Hourly statistics contains datetime keys (YYYY-MM-DD-HH) and statistics data as values.
 *         Used to store statistics for every hour of the last 30 days (inclusive).
 *       - Sessions contains started and ended timestamps for each session.
 *         Used to store connection sessions data for the last 30 days.
 *       - Total data and duration is used to store total connection duration and total used data.
 *         Used to store total data for sessions that are older than 30 days.
 *       - Optional last session used to track connection duration statistics for the current session.
 *
 * Statistics implemented as time-based aggregation system:
 * - New statistics data is initially stored in hourly bucket (YYYY-MM-DD-HH).
 * - After 30 days, hourly data is consolidated into a single 'total' record.
 *
 * Data consolidation occurs when service worker starts ({@link init} method)
 * by checking timestamp thresholds and data from older buckets is merged from hourly to total.
 *
 * Duration tracking works by tracking last session timestamps,
 * when connection starts - we start a session, when connection ends - we update
 * end timestamp and move it to sessions array, in between we update it at some (5 min)
 * interval our end updated timestamp. Also if session is older than 30 days
 * we move it to total duration.
 */
export class StatisticsStorage implements StatisticsStorageInterface {
    /**
     * Key for statistics storage in local storage.
     */
    private static readonly STATISTICS_STORAGE_KEY = 'statistics.storage';

    /**
     * Time in milliseconds after which data is consolidated:
     * - Hourly statistics are moved to total statistics.
     * - Sessions are moved to total duration.
     *
     * The value is set to 30 days.
     */
    private static readonly MOVE_AFTER_MS = 30 * ONE_DAY_MS;

    /**
     * Throttle timeout for saving statistics to local storage.
     * The value is set to 5 seconds.
     */
    private static readonly SAVE_STATISTICS_TIMEOUT_MS = 5 * 1000;

    /**
     * Index in statistics data tuple for downloaded bytes.
     */
    private static readonly DOWNLOADED_INDEX = 0;

    /**
     * Index in statistics data tuple for uploaded bytes.
     */
    private static readonly UPLOADED_INDEX = 1;

    /**
     * Index in statistics tuple for duration milliseconds.
     */
    private static readonly DURATION_INDEX = 2;

    /**
     * Index in period statistics data tuple for date or datetime.
     */
    private static readonly DATE_INDEX = 0;

    /**
     * Index in period statistics data tuple for statistics data.
     */
    private static readonly DATA_INDEX = 1;

    /**
     * Index in statistics session tuple for started timestamp.
     */
    private static readonly STARTED_TIMESTAMP_INDEX = 0;

    /**
     * Index in statistics session tuple for ended timestamp.
     */
    private static readonly ENDED_TIMESTAMP_INDEX = 1;

    /**
     * Browser local storage.
     */
    private storage: StorageInterface;

    /**
     * Statistics for all locations with started timestamp.
     *
     * Initialized in {@link init} method.
     */
    private statistics: Statistics;

    /**
     * Flag indicating whether telemetry module is initialized or not.
     */
    private isInitialized = false;

    /**
     * Last timestamp when statistics were updated.
     * This is used to determine if statistics should be updated before sending it to the UI.
     */
    private statisticsUpdatedTimestamp = 0;

    /**
     * Constructor.
     */
    constructor({ storage }: StatisticsStorageParameters) {
        this.storage = storage;
        this.saveStatistics = throttle(
            this.saveStatistics.bind(this),
            StatisticsStorage.SAVE_STATISTICS_TIMEOUT_MS,
        );
    }

    /** @inheritdoc */
    public init = async (): Promise<void> => {
        try {
            await this.gainStatistics();
            this.isInitialized = true;
            log.info('Statistics storage ready');
        } catch (e) {
            log.error('Unable to initialize statistics storage, due to error:', e);
        }
    };

    /**
     * Saves the statistics to local storage.
     *
     * @param shouldTriggerUpdate True if method emits STATS_UPDATED event to listeners,
     * false otherwise. Default value is true.
     */
    private async saveStatistics(shouldTriggerUpdate = true): Promise<void> {
        try {
            await this.storage.set<Statistics>(
                StatisticsStorage.STATISTICS_STORAGE_KEY,
                this.statistics,
            );

            // notify listeners about statistics update,
            // we do it only after statistics is saved
            // to not trigger UI updates every time statistics is changed
            if (shouldTriggerUpdate) {
                notifier.notifyListeners(notifier.types.STATS_UPDATED);
            }
        } catch (e) {
            log.error('Unable to save statistics storage, due to error:', e);
        }
    }

    /**
     * Reads the statistics from local storage, and:
     * - If not found, creates a new one,
     * - If found, updates stale statistics;
     *
     * After that, it saves the statistics to local storage.
     */
    private async gainStatistics(): Promise<void> {
        const statistics = await this.storage.get<Statistics>(
            StatisticsStorage.STATISTICS_STORAGE_KEY,
        );

        if (!statistics) {
            this.statistics = {
                locations: {},
                startedTimestamp: Date.now(),
            };
        } else {
            this.statistics = statistics;
            this.updateStaleStatistics();
        }

        await this.saveStatistics();
    }

    /**
     * Updates stale statistics by:
     * 1. Moving last session to sessions array and updating total duration
     *    (see {@link moveDuration} for detailed explanation),
     * 2. Moving hourly statistics to total statistics if 30 days passed
     *    (see {@link moveStatistics} for detailed explanation).
     *
     * @param timestamp Timestamp for which calculations should be made,
     * if not provided Date.now() will be used.
     * @param shouldMoveLastSession Should method move the last session to sessions array.
     */
    private updateStaleStatistics(
        timestamp = Date.now(),
        shouldMoveLastSession = true,
    ): void {
        this.statisticsUpdatedTimestamp = timestamp;
        Object.values(this.statistics.locations).forEach((locationData) => {
            this.moveDuration(locationData, timestamp, shouldMoveLastSession);
            this.moveStatistics(locationData, timestamp);
        });
    }

    /**
     * Moves the last session to the sessions array and updates total duration
     * if there are any session that are older than 30 days.
     *
     * @param locationData Location data to move duration for.
     * @param timestamp Timestamp to compare with.
     * @param shouldMoveLastSession Should method move the last session to sessions array.
     */
    private moveDuration(
        locationData: StatisticsLocationData,
        timestamp: number,
        shouldMoveLastSession: boolean,
    ): void {
        const { sessions, total, lastSession } = locationData;
        const threshold = timestamp - StatisticsStorage.MOVE_AFTER_MS;

        // Move last session to sessions array if it exists, it might exist
        // in cases if last session was terminated without disconnection,
        // only if `shouldMoveLastSession` is true.
        if (shouldMoveLastSession && lastSession) {
            sessions.push(lastSession);
            delete locationData.lastSession;
        }

        const indicesToDelete = new Set<number>();
        for (let i = 0; i < sessions.length; i += 1) {
            const [startedTimestamp, endedTimestamp] = sessions[i];

            // delete and skip if session is not valid
            if (
                startedTimestamp >= endedTimestamp
                || startedTimestamp < 0
                || endedTimestamp < 0
                || startedTimestamp > timestamp
                || endedTimestamp > timestamp
            ) {
                indicesToDelete.add(i);
                continue;
            }

            if (endedTimestamp <= threshold) {
                // case 1: session is fully outdated, we should add its
                // duration to total duration and remove it from sessions
                total[StatisticsStorage.DURATION_INDEX] += endedTimestamp - startedTimestamp;
                indicesToDelete.add(i);
            } else if (startedTimestamp < threshold && endedTimestamp > threshold) {
                // case 2: session is partially outdated, we should add partial duration
                // to total duration and update started timestamp to threshold
                total[StatisticsStorage.DURATION_INDEX] += threshold - startedTimestamp;
                sessions[i][StatisticsStorage.STARTED_TIMESTAMP_INDEX] = threshold;
            } else {
                // case 3: session is not outdated, we should keep it as is
                // and we exit the loop as next sessions are also not outdated
                break;
            }
        }

        if (indicesToDelete.size > 0) {
            locationData.sessions = sessions.filter(
                (data, index) => !indicesToDelete.has(index),
            );
        }
    }

    /**
     * Moves hourly statistics by traversing the each available hourly data
     * and if for given hour 30 days is passed, it moves it to total statistics.
     *
     * @param locationData Location data.
     * @param timestamp Timestamp to compare with.
     */
    private moveStatistics(locationData: StatisticsLocationData, timestamp: number): void {
        const { hourly, total } = locationData;
        const borderTimestamp = cropTimestampMinutes(timestamp - StatisticsStorage.MOVE_AFTER_MS);
        const indicesToDelete = new Set<number>();

        for (let i = 0; i < hourly.length; i += 1) {
            const [key, data] = hourly[i];

            // convert key to date
            const date = keyToDate(key);

            // delete and skip if date is not valid
            if (!date || date.getTime() > timestamp) {
                indicesToDelete.add(i);
                continue;
            }

            // skip if 30 days is not passed, inclusive check because we need
            // to keep last hour for cases if user timezone has daily savings time
            if (date.getTime() >= borderTimestamp) {
                continue;
            }

            // move hourly data to total data
            const [downloadedBytes, uploadedBytes] = data;
            total[StatisticsStorage.DOWNLOADED_INDEX] += downloadedBytes;
            total[StatisticsStorage.UPLOADED_INDEX] += uploadedBytes;

            // mark index for deletion
            indicesToDelete.add(i);
        }

        if (indicesToDelete.size > 0) {
            locationData.hourly = hourly.filter(
                (data, index) => !indicesToDelete.has(index),
            );
        }
    }

    /**
     * Gets location data for the given location ID.
     * If not found, creates a new one.
     *
     * @param locationId Location ID to get data for.
     *
     * @returns Location data.
     */
    private getLocationData(locationId: string): StatisticsLocationData {
        let locationData: StatisticsLocationData;
        if (this.statistics.locations[locationId]) {
            locationData = this.statistics.locations[locationId];
        } else {
            locationData = {
                hourly: [],
                total: [0, 0, 0],
                sessions: [],
            };
            this.statistics.locations[locationId] = locationData;
        }

        return locationData;
    }

    /**
     * Gets hourly statistics data for a given date.
     * If not found, creates a new one.
     *
     * @param locationData Location data.
     * @param date Date to get statistics for. If not provided, current date is used.
     *
     * @returns Statistics data for given date.
     */
    private getHourlyData(locationData: StatisticsLocationData, date = new Date()): StatisticsDataTuple {
        const { hourly } = locationData;
        const dateKey = dateToKey(date);

        let hourlyEntry = hourly.find((data) => data[StatisticsStorage.DATE_INDEX] === dateKey);
        if (!hourlyEntry) {
            hourlyEntry = [dateKey, [0, 0]];
            hourly.push(hourlyEntry);
        }

        return hourlyEntry[StatisticsStorage.DATA_INDEX];
    }

    /**
     * Asserts that the statistics storage is initialized.
     * Used to protect against calling public methods before initialization.
     *
     * @throws Error if the statistics storage is not initialized.
     */
    private assertInitialized(): void {
        if (!this.isInitialized) {
            throw new Error('Statistics storage is not initialized yet. Please call init() method first.');
        }
    }

    /** @inheritdoc */
    public addTraffic = async (locationId: string, data: AddStatisticsDataTraffic): Promise<void> => {
        this.assertInitialized();

        const locationData = this.getLocationData(locationId);
        const hourlyData = this.getHourlyData(locationData);

        // Update traffic data
        const { downloadedBytes, uploadedBytes } = data;
        hourlyData[StatisticsStorage.DOWNLOADED_INDEX] += downloadedBytes;
        hourlyData[StatisticsStorage.UPLOADED_INDEX] += uploadedBytes;

        // Update session timestamp if exists, it might not exist if user
        // already disconnected but websocket sent traffic stats update later
        if (locationData.lastSession) {
            locationData.lastSession[StatisticsStorage.ENDED_TIMESTAMP_INDEX] = Date.now();
        }

        await this.saveStatistics();
    };

    /** @inheritdoc */
    public startDuration = async (locationId: string): Promise<void> => {
        this.assertInitialized();

        const locationData = this.getLocationData(locationId);

        // Move last session to sessions array if it exists, it might exist
        // in cases if last session was terminated without disconnection
        if (locationData.lastSession) {
            locationData.sessions.push(locationData.lastSession);
        }

        const now = Date.now();
        locationData.lastSession = [now, now];

        await this.saveStatistics();
    };

    /**
     * Updates `lastUpdatedTimestamp` of the last session.
     *
     * @param locationId Location ID to update last session for.
     *
     * @returns Location data with updated last session or null if not found.
     */
    private updateLastSession(locationId: string): StatisticsLocationData | null {
        const locationData = this.getLocationData(locationId);
        if (!locationData.lastSession) {
            return null;
        }

        locationData.lastSession[StatisticsStorage.ENDED_TIMESTAMP_INDEX] = Date.now();

        return locationData;
    }

    /** @inheritdoc */
    public updateDuration = async (locationId: string): Promise<void> => {
        this.assertInitialized();

        const locationData = this.updateLastSession(locationId);

        // save statistics if last session is updated
        if (locationData) {
            await this.saveStatistics();
        }
    };

    /** @inheritdoc */
    public endDuration = async (locationId: string): Promise<void> => {
        this.assertInitialized();

        const locationData = this.updateLastSession(locationId);

        // distribute duration to statistics and save if updated
        if (locationData) {
            // skip if last session is not set
            const { lastSession, sessions } = locationData;
            if (!lastSession) {
                return;
            }

            // move last session to sessions array
            sessions.push(lastSession);
            delete locationData.lastSession;

            await this.saveStatistics();
        }
    };

    /** @inheritdoc */
    public getStatistics = async (): Promise<Statistics> => {
        this.assertInitialized();

        const now = Date.now();

        // we need to update statistics first and only after that return the data
        // this is needed in case if extension is running longer than 1 hour
        if (!isSameHour(this.statisticsUpdatedTimestamp, now, { in: utc })) {
            // update stale statistics, but do not move last session to sessions array
            // because there are still might be active proxy connection
            this.updateStaleStatistics(now, false);

            // we do not trigger update, because we already sending it
            await this.saveStatistics(false);
        }

        return this.statistics;
    };

    /** @inheritdoc */
    public clearStatistics = async (): Promise<void> => {
        this.assertInitialized();

        // delete all locations
        this.statistics.locations = {};

        // renew started time
        this.statistics.startedTimestamp = Date.now();

        await this.saveStatistics();
    };
}
