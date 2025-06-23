/* eslint-disable no-continue */
/* eslint-disable no-param-reassign */
import throttle from 'lodash/throttle';
import { utc } from '@date-fns/utc';
import { isSameHour } from 'date-fns/isSameHour';
import onChange from 'on-change';

import { ONE_DAY_MS } from '../../common/constants';
import { log } from '../../common/logger';
import { type StorageInterface } from '../browserApi/storage';
import { notifier } from '../../common/notifier';

import { dateToKey, keyToDate } from './utils';
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
 *     - Location data contains hourly, daily, total statistics, sessions, total duration and optional last session.
 *       - Hourly statistics contains datetime keys (YYYY-MM-DD-HH) and statistics data as values.
 *         Used to store statistics for the last 25 hours (inclusive).
 *       - Daily statistics contains date keys (YYYY-MM-DD) and statistics data as values.
 *         Used to store statistics older than 25 hours up to the last 31 days (inclusive).
 *       - Total statistics used to store statistics that are older than 31 days.
 *       - Sessions contains started and ended timestamps for each session.
 *         Used to store connection sessions data for the last 30 days.
 *       - Total duration is used to store total connection duration in milliseconds.
 *         Used to store total connection duration for sessions that are older than 30 days.
 *       - Optional last session used to track connection duration statistics for the current session.
 *
 * Statistics implemented as time-based aggregation system:
 * - New statistics data is initially stored in hourly buckets (YYYY-MM-DD-HH).
 * - After 25 hours, hourly data is consolidated into daily buckets (YYYY-MM-DD).
 * - After 31 days, daily data is consolidated into a single 'total' record.
 *
 * The reason why we store 25 hours / 31 days of statistics instead of 24 hours / 30 days
 * is due to storage design, because we can't store statistics by minutes we lose precise
 * information about the last hour / day For example if user requests statistics
 * for 28 May 2025 22:51:30 - 29 May 2025 22:51:30, but because we store statistics by full hours,
 * we can only show statistics from 28 May 2025 22:00:00 to 29 May 2025 22:51:30,
 * or 29 May 2025 23:00:00 to 29 May 2025 22:51:30, we move towards the top edge of the hour
 * to keep the last hour data. Same applies to daily statistics.
 *
 * Data consolidation occurs when service worker starts ({@link init} method)
 * by checking timestamp thresholds and data from older buckets
 * is merged into the next level (hourly to daily, daily to total).
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
     * Time in milliseconds after which the hourly statistics are moved to daily statistics.
     * The value is set to 24 hours.
     */
    private static readonly MOVE_HOURLY_STATS_AFTER_MS = ONE_DAY_MS;

    /**
     * Time in milliseconds after which the daily statistics are moved to total statistics.
     * The value is set to 30 days.
     */
    private static readonly MOVE_DAILY_STATS_AFTER_MS = 30 * ONE_DAY_MS;

    /**
     * Time in milliseconds after which session is moved from sessions array to total duration.
     * The value is set to 30 days.
     */
    private static readonly MOVE_DURATION_AFTER_MS = 30 * ONE_DAY_MS;

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
     * Mutex flag to prevent unnecessary writes to storage.
     * This value is `true` when statistics data is changed and write is allowed.
     *
     * NOTE: Do not change this flag manually, because this flag is changed
     * only when proxy detects changes in statistics data.
     */
    private isStatisticsChanged = false;

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
     */
    private async saveStatistics(): Promise<void> {
        // skip saving if nothing changed
        if (!this.isStatisticsChanged) {
            return;
        }

        try {
            // save original un-proxied statistics data to local storage,
            // because when browser serializes proxied data, it converts
            // it to plain object and breaks storage shape
            await this.storage.set<Statistics>(
                StatisticsStorage.STATISTICS_STORAGE_KEY,
                onChange.target(this.statistics),
            );

            // notify listeners about statistics update,
            // we do it only after statistics is saved
            // to not trigger UI updates every time statistics is changed
            notifier.notifyListeners(notifier.types.STATS_UPDATED);

            // mark statistics as unchanged
            this.isStatisticsChanged = false;
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
        let statistics = await this.storage.get<Statistics>(
            StatisticsStorage.STATISTICS_STORAGE_KEY,
        );

        // We are passing arrow function to onChange,
        // because `onChange` will re-bind `this` to the proxied object,
        // so we need to use arrow function to keep the context of `this`.
        const handleStatisticsChanged = () => {
            this.isStatisticsChanged = true;
        };

        if (!statistics) {
            statistics = {
                locations: {},
                startedTimestamp: Date.now(),
            };
            this.statistics = onChange(statistics, handleStatisticsChanged);
            this.isStatisticsChanged = true;
        } else {
            this.statistics = onChange(statistics, handleStatisticsChanged);
            this.updateStaleStatistics();
        }

        await this.saveStatistics();
    }

    /**
     * Updates stale statistics by:
     * 1. Moving last session to sessions array and updating total duration
     *    (see {@link moveDuration} for detailed explanation),
     * 2. Moving hourly statistics to daily statistics if 25 hours passed
     *    (see {@link moveStatistics} for detailed explanation),
     * 3. Moving daily statistics to total statistics if 31 days passed
     *    (see {@link moveStatistics} for detailed explanation);
     *
     * Note: Order of operations described above is important,
     * because we are moving to the top of the statistics period.
     */
    private updateStaleStatistics(): void {
        // create before to make consistent calculations
        const now = Date.now();

        this.statisticsUpdatedTimestamp = now;
        Object.values(this.statistics.locations).forEach((locationData) => {
            this.moveDuration(locationData, now);
            this.moveStatistics(locationData, now, true);
            this.moveStatistics(locationData, now, false);
        });
    }

    /**
     * Moves the last session to the sessions array and updates total duration
     * if there are any session that are older than 30 days.
     *
     * @param locationData Location data to move duration for.
     * @param timestamp Timestamp to compare with.
     */
    private moveDuration(
        locationData: StatisticsLocationData,
        timestamp: number,
    ): void {
        const { sessions } = locationData;
        const threshold = timestamp - StatisticsStorage.MOVE_DURATION_AFTER_MS;

        const indicesToDelete = new Set<number>();
        for (let i = 0; i < sessions.length; i += 1) {
            const [startedTimestamp, endedTimestamp] = sessions[i];

            // skip if session is not valid
            if (startedTimestamp >= endedTimestamp || startedTimestamp < 0 || endedTimestamp < 0) {
                indicesToDelete.add(i);
                continue;
            }

            if (endedTimestamp <= threshold) {
                // case 1: session is fully outdated, we should add its
                // duration to total duration and remove it from sessions
                locationData.totalDurationMs += endedTimestamp - startedTimestamp;
                indicesToDelete.add(i);
            } else if (startedTimestamp < threshold && endedTimestamp > threshold) {
                // case 2: session is partially outdated, we should add partial duration
                // to total duration and update started timestamp to threshold
                locationData.totalDurationMs += threshold - startedTimestamp;
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
     * Moves hourly / daily statistics by traversing the each available hourly / daily data
     * and if for given hour / day 25 hours / 31 days is passed, it moves the statistics
     * to according daily statistics (`YYYY-MM-DD-HH` -> `YYYY-MM-DD` / `YYYY-MM-DD` -> `total`).
     *
     * @param locationData Location data.
     * @param timestamp Timestamp to compare with.
     * @param isHourly Whether to move hourly or daily statistics.
     */
    private moveStatistics(
        locationData: StatisticsLocationData,
        timestamp: number,
        isHourly: boolean,
    ): void {
        const { total } = locationData;

        const storageToUpdate = isHourly ? 'hourly' : 'daily';
        const sourceStorage = locationData[storageToUpdate];

        const borderTimestamp = isHourly
            ? StatisticsStorage.getHourlyBorderTimestamp(timestamp)
            : StatisticsStorage.getDailyBorderTimestamp(timestamp);

        const indicesToDelete = new Set<number>();
        for (let i = 0; i < sourceStorage.length; i += 1) {
            const [key, data] = sourceStorage[i];

            // convert key to date
            const date = keyToDate(key);

            // delete and skip if date is not valid
            if (!date) {
                indicesToDelete.add(i);
                continue;
            }

            // skip if 24 hours / 30 days is not passed, inclusive (>=)
            // to store last 25 hours / 31 days data, instead of last 24 hours / 30 days
            // see class jsdoc for explanation
            if (date.getTime() >= borderTimestamp) {
                continue;
            }

            // move hourly / daily data to daily data / total data
            const [downloadedBytes, uploadedBytes] = data;

            let targetData: StatisticsDataTuple;
            if (isHourly) {
                targetData = this.getPeriodStatistics(locationData, false, date);
            } else {
                targetData = total;
            }

            targetData[StatisticsStorage.DOWNLOADED_INDEX] += downloadedBytes;
            targetData[StatisticsStorage.UPLOADED_INDEX] += uploadedBytes;

            // mark index for deletion
            indicesToDelete.add(i);
        }

        if (indicesToDelete.size > 0) {
            locationData[storageToUpdate] = sourceStorage.filter(
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
                daily: [],
                total: [0, 0],
                sessions: [],
                totalDurationMs: 0,
            };
            this.statistics.locations[locationId] = locationData;
        }

        return locationData;
    }

    /**
     * Gets statistics data for the given hourly / daily -> datetime / date for a given date.
     * If not found, creates a new one.
     *
     * @param locationData Location data.
     * @param isHourly Whether to get hourly or daily statistics.
     * @param date Date to get statistics for. If not provided, current date is used.
     *
     * @returns Statistics data for given date.
     */
    private getPeriodStatistics(
        { hourly, daily }: StatisticsLocationData,
        isHourly: boolean,
        date = new Date(),
    ): StatisticsDataTuple {
        const dateKey = dateToKey(isHourly, date);
        const periodStorage = isHourly ? hourly : daily;

        let periodData = periodStorage.find((data) => data[StatisticsStorage.DATE_INDEX] === dateKey);
        if (!periodData) {
            periodData = [dateKey, [0, 0]];
            periodStorage.push(periodData);
        }

        return periodData[StatisticsStorage.DATA_INDEX];
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
        const hourlyData = this.getPeriodStatistics(locationData, true);

        const { downloadedBytes, uploadedBytes } = data;
        hourlyData[StatisticsStorage.DOWNLOADED_INDEX] += downloadedBytes;
        hourlyData[StatisticsStorage.UPLOADED_INDEX] += uploadedBytes;
        await this.saveStatistics();
    };

    /** @inheritdoc */
    public startDuration = async (locationId: string): Promise<void> => {
        this.assertInitialized();

        const locationData = this.getLocationData(locationId);

        const now = Date.now();
        if (!locationData.lastSession) {
            locationData.lastSession = [now, now];
        } else {
            locationData.lastSession[StatisticsStorage.STARTED_TIMESTAMP_INDEX] = now;
            locationData.lastSession[StatisticsStorage.ENDED_TIMESTAMP_INDEX] = now;
        }

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
            this.statisticsUpdatedTimestamp = now;
            Object.values(this.statistics.locations).forEach((locationData) => {
                this.moveDuration(locationData, now);
                this.moveStatistics(locationData, now, true);
                this.moveStatistics(locationData, now, false);
            });

            await this.saveStatistics();
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

    /**
     * Gets the timestamp with cropped hours or minutes for the given timestamp.
     *
     * @param timestamp Timestamp to crop.
     * @param isHourly If true crops the minutes, otherwise crops the hours.
     *
     * @returns Cropped timestamp.
     */
    private static getCroppedTimestamp(timestamp: number, isHourly: boolean): number {
        const date = new Date(timestamp);
        if (isHourly) {
            date.setUTCMinutes(0, 0, 0);
        } else {
            date.setUTCHours(0, 0, 0, 0);
        }
        return date.getTime();
    }

    /**
     * Gets the timestamp of the hourly border for the given timestamp.
     * Hourly border is the timestamp when hourly statistics should be moved to daily statistics.
     *
     * @param timestamp Timestamp to get the border for.
     *
     * @returns Timestamp of the hourly border.
     */
    private static getHourlyBorderTimestamp(timestamp: number): number {
        return this.getCroppedTimestamp(timestamp - StatisticsStorage.MOVE_HOURLY_STATS_AFTER_MS, true);
    }

    /**
     * Gets the timestamp of the daily border for the given timestamp.
     * Daily border is the timestamp when daily statistics should be moved to total statistics.
     *
     * @param timestamp Timestamp to get the border for.
     *
     * @returns Timestamp of the daily border.
     */
    private static getDailyBorderTimestamp(timestamp: number): number {
        return this.getCroppedTimestamp(timestamp - StatisticsStorage.MOVE_DAILY_STATS_AFTER_MS, false);
    }
}
