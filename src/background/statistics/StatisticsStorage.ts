import throttle from 'lodash/throttle';

import { ONE_DAY_MS, ONE_HOUR_MS } from '../../common/constants';
import { log } from '../../common/logger';
import { type StorageInterface } from '../browserApi/storage';

import { dateToKey, keyToDate, watchChanges } from './utils';
import {
    type AddStatisticsDataTraffic,
    type StatisticsLocationData,
    type StatisticsData,
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
 *     - Location data contains hourly, daily, total statistics and optional duration tracker.
 *       - Hourly statistics contains datetime keys (YYYY-MM-DD-HH) and statistics data as values.
 *         Used to store statistics for the last 24 hours (inclusive).
 *       - Daily statistics contains date keys (YYYY-MM-DD) and statistics data as values.
 *         Used to store statistics older than 24 hours up to the last 30 days (inclusive).
 *       - Total statistics used to store statistics that are older than 30 days.
 *       - Optional duration tracker used to track connection duration statistics.
 *
 * Statistics implemented as time-based aggregation system:
 * - New statistics data is initially stored in hourly buckets (YYYY-MM-DD-HH).
 * - After 24 hours, hourly data is consolidated into daily buckets (YYYY-MM-DD).
 * - After 30 days, daily data is consolidated into a single 'total' record.
 *
 * Data consolidation occurs when service worker starts ({@link init} method)
 * by checking timestamp thresholds and data from older buckets
 * is merged into the next level (hourly to daily, daily to total).
 *
 * Duration tracking works by creating a tracker object when a connection starts, updating it
 * periodically during an active connection, and calculating the total duration when the connection ends.
 * The calculated duration is then distributed to the appropriate hourly, daily, and total buckets.
 */
export class StatisticsStorage implements StatisticsStorageInterface {
    /**
     * Key for statistics storage in local storage.
     */
    private static readonly STATISTICS_STORAGE_KEY = 'statistics.storage';

    /**
     * Default statistics data object.
     * Used when the statistics data is not found in hourly / daily / total storage.
     */
    private static readonly DEFAULT_STATISTICS_DATA: StatisticsData = {
        downloadedBytes: 0,
        uploadedBytes: 0,
        durationMs: 0,
    };

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
     * Throttle timeout for saving statistics to local storage.
     * The value is set to 5 seconds.
     */
    private static readonly SAVE_STATISTICS_TIMEOUT_MS = 5 * 1000;

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
            log.info('Statistics storage ready');
            await this.gainStatistics();
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
            await this.storage.set<Statistics>(
                StatisticsStorage.STATISTICS_STORAGE_KEY,
                this.statistics,
            );
            this.isStatisticsChanged = false;
        } catch (e) {
            log.error('Unable to save statistics storage, due to error:', e);
        }
    }

    /**
     * Handles event when statistics data is changed.
     */
    private handleStatisticsChanged(): void {
        // set flag to true to allow saving statistics
        this.isStatisticsChanged = true;
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

        if (!statistics) {
            statistics = {
                locations: {},
                startedTimestamp: Date.now(),
            };

            this.statistics = watchChanges(statistics, this.handleStatisticsChanged.bind(this));
            this.isStatisticsChanged = true;
        } else {
            this.statistics = watchChanges(statistics, this.handleStatisticsChanged.bind(this));
            this.updateStaleStatistics();
        }

        await this.saveStatistics();
    }

    /**
     * Updates stale statistics by:
     * 1. Distributing the duration tracker to hourly / daily / total statistics
     *    (see {@link distributeDuration} for detailed explanation),
     * 2. Moving hourly statistics to daily statistics if 24 hours passed
     *    (see {@link moveStatistics} for detailed explanation),
     * 3. Moving daily statistics to total statistics if 30 days passed
     *    (see {@link moveStatistics} for detailed explanation);
     *
     * Note: Order of operations described above is important,
     * because we are moving to the top of the statistics period.
     */
    private updateStaleStatistics(): void {
        // create before to make consistent calculations
        const now = Date.now();

        Object.values(this.statistics.locations).forEach((locationData) => {
            this.distributeDuration(locationData, now);
            this.moveStatistics(locationData, now, true);
            this.moveStatistics(locationData, now, false);
        });
    }

    /**
     * Distributes the duration tracker of location data to hourly / daily / total statistics.
     *
     * @see {@link distributeDurationAcrossPeriod} for more details how distribution works.
     *
     * @param locationData Location data.
     * @param timestamp Timestamp to compare with.
     */
    private distributeDuration(locationData: StatisticsLocationData, timestamp: number): void {
        // skip if duration tracker is not set
        const { durationTracker } = locationData;
        if (!durationTracker) {
            return;
        }

        const { total } = locationData;
        const { startedTimestamp, lastUpdatedTimestamp } = durationTracker;

        const deleteDurationTracker = () => {
            // eslint-disable-next-line no-param-reassign
            delete locationData.durationTracker;
        };

        // if the duration is not valid, delete tracker and skip
        if (lastUpdatedTimestamp - startedTimestamp <= 0) {
            deleteDurationTracker();
            return;
        }

        const dailyBorderTimestamp = StatisticsStorage.getDailyBorderTimestamp(timestamp);
        const hourlyBorderTimestamp = StatisticsStorage.getHourlyBorderTimestamp(timestamp);

        /**
         * Duration can go to total only if connection was started before 30 days.
         * If connection was started after 30 days, `totalDuration` will be negative.
         *
         * We are covering following cases:
         * - started < lastUpdated < 30 days < 24 hours -> lastUpdated - started goes to total,
         * - started < 30 days < lastUpdated < 24 hours -> 30 days - started goes to total,
         * - started < 30 days < 24 hours < lastUpdated -> 30 days - started goes to total;
         */
        const totalDuration = Math.min(dailyBorderTimestamp, lastUpdatedTimestamp) - startedTimestamp;

        // add to total if the duration is valid
        if (totalDuration > 0) {
            total.durationMs += totalDuration;
        }

        /**
         * We are determining the start and end timestamps for daily duration distribution.
         *
         * We are covering following cases:
         * - started < 30 days < lastUpdated < 24 hours -> lastUpdated - 30 days distributed to daily,
         * - 30 days < started < lastUpdated < 24 hours -> lastUpdated - started distributed to daily,
         * - started < 30 days < 24 hours < lastUpdated -> 24 hours - 30 days distributed to daily,
         * - 30 days < started < 24 hours < lastUpdated -> 24 hours - started distributed to daily;
         */
        const dailyStart = Math.max(dailyBorderTimestamp, startedTimestamp);
        const dailyEnd = Math.min(hourlyBorderTimestamp, lastUpdatedTimestamp);

        // distribute across daily
        this.distributeDurationAcrossPeriod(locationData, dailyStart, dailyEnd, false);

        /**
         * We are determining the start and end timestamps for hourly duration distribution.
         *
         * We are covering following cases:
         * - started < 30 days < 24 hours < lastUpdated -> lastUpdated - 24 hours distributed to hourly
         * - 30 days < started < 24 hours < lastUpdated -> lastUpdated - 24 hours distributed to hourly
         * - 30 days < 24 hours < started < lastUpdated -> lastUpdated - started distributed to hourly
         */
        const hourlyStart = Math.max(hourlyBorderTimestamp, startedTimestamp);
        const hourlyEnd = Math.min(timestamp, lastUpdatedTimestamp);

        // distribute across hourly
        this.distributeDurationAcrossPeriod(locationData, hourlyStart, hourlyEnd, true);

        // delete tracker after tracker is distributed
        deleteDurationTracker();
    }

    /**
     * Distributes the duration across hourly / daily statistics.
     *
     * @param locationData Location data.
     * @param start Start timestamp.
     * @param end End timestamp.
     * @param isHourly Whether to distribute across hourly or daily statistics.
     */
    private distributeDurationAcrossPeriod(
        locationData: StatisticsLocationData,
        start: number,
        end: number,
        isHourly: boolean,
    ): void {
        // skip if duration is not valid
        if (end - start <= 0) {
            return;
        }

        // step size in milliseconds
        const step = isHourly ? ONE_HOUR_MS : ONE_DAY_MS;

        /**
         * First period is special, because it can be less than step size.
         * For example:
         * - start = 2025-05-21 00:23:21
         * - end = 2025-05-21 02:37:33
         *
         * In this case:
         * 1. This period should be 36 minutes 39 seconds (00:23:21 - 01:00:00).
         * 2. The next period should be 1 hour (01:00:00 - 02:00:00).
         * 3. The last period should be 37 minutes 33 seconds (02:00:00 - 02:37:33).
         */
        const timeLeftOnFirstPeriod = step - (start - StatisticsStorage.getCroppedTimestamp(start, isHourly));

        let current = start;
        let isFirstIteration = true;
        let increment = timeLeftOnFirstPeriod;

        while (current < end) {
            const data = this.getPeriodStatistics(locationData, isHourly, new Date(current));

            const durationToAdd = Math.min(current + increment, end) - current;
            data.durationMs += durationToAdd;
            current += durationToAdd;

            if (isFirstIteration) {
                increment = step;
                isFirstIteration = false;
            }
        }
    }

    /**
     * Moves hourly / daily statistics by traversing the each available hourly / daily data
     * and if for given hour / day 24 hours / 30 days is passed, it moves the statistics
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
        const { hourly, daily, total } = locationData;

        const sourceStorage = isHourly
            ? hourly
            : daily;

        const borderTimestamp = isHourly
            ? StatisticsStorage.getHourlyBorderTimestamp(timestamp)
            : StatisticsStorage.getDailyBorderTimestamp(timestamp);

        Object.entries(sourceStorage).forEach(([key, data]) => {
            // convert key to date
            const date = keyToDate(key);

            // delete and skip if date is not valid
            if (!date) {
                delete sourceStorage[key];
                return;
            }

            // skip if 24 hours / 30 days is not passed, inclusive (>=)
            // to store last 24 hours / 30 days data, instead of last 23 hours / 29 days
            if (date.getTime() >= borderTimestamp) {
                return;
            }

            // move hourly / daily data to daily data / total data
            const { downloadedBytes, uploadedBytes, durationMs } = data;

            let targetData: StatisticsData;
            if (isHourly) {
                targetData = this.getPeriodStatistics(locationData, false, date);
            } else {
                targetData = total;
            }

            targetData.downloadedBytes += downloadedBytes;
            targetData.uploadedBytes += uploadedBytes;
            targetData.durationMs += durationMs;

            // remove hourly / daily data after moving
            delete sourceStorage[key];
        });
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
                hourly: {},
                daily: {},
                total: {
                    ...StatisticsStorage.DEFAULT_STATISTICS_DATA,
                },
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
    ): StatisticsData {
        const dateKey = dateToKey(isHourly, date);
        const periodStorage = isHourly ? hourly : daily;

        let periodData: StatisticsData;
        if (periodStorage[dateKey]) {
            periodData = periodStorage[dateKey];
        } else {
            periodData = { ...StatisticsStorage.DEFAULT_STATISTICS_DATA };
            periodStorage[dateKey] = periodData;
        }

        return periodData;
    }

    /** @inheritdoc */
    public addTraffic = async (locationId: string, data: AddStatisticsDataTraffic): Promise<void> => {
        const locationData = this.getLocationData(locationId);
        const hourlyData = this.getPeriodStatistics(locationData, true);

        const { downloadedBytes, uploadedBytes } = data;
        hourlyData.downloadedBytes += downloadedBytes;
        hourlyData.uploadedBytes += uploadedBytes;
        await this.saveStatistics();
    };

    /** @inheritdoc */
    public startDuration = async (locationId: string): Promise<void> => {
        const locationData = this.getLocationData(locationId);

        const now = Date.now();
        if (!locationData.durationTracker) {
            locationData.durationTracker = {
                startedTimestamp: now,
                lastUpdatedTimestamp: now,
            };
        } else {
            locationData.durationTracker.startedTimestamp = now;
            locationData.durationTracker.lastUpdatedTimestamp = now;
        }

        await this.saveStatistics();
    };

    /**
     * Updates `lastUpdatedTimestamp` of the duration tracker.
     *
     * @param locationId Location ID to update duration tracker for.
     *
     * @returns Location data with updated duration tracker or null if not found.
     */
    private updateDurationTracker(locationId: string): StatisticsLocationData | null {
        const locationData = this.getLocationData(locationId);
        if (!locationData.durationTracker) {
            return null;
        }

        locationData.durationTracker.lastUpdatedTimestamp = Date.now();

        return locationData;
    }

    /** @inheritdoc */
    public updateDuration = async (locationId: string): Promise<void> => {
        this.updateDurationTracker(locationId);
        await this.saveStatistics();
    };

    /** @inheritdoc */
    public endDuration = async (locationId: string): Promise<void> => {
        const locationData = this.updateDurationTracker(locationId);

        // distribute duration to statistics and save if updated
        if (locationData) {
            this.distributeDuration(locationData, Date.now());
            await this.saveStatistics();
        }
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
