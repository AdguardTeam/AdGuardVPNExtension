import { ONE_DAY_MS, ONE_HOUR_MS } from '../../common/constants';
import { log } from '../../common/logger';
import { type StorageInterface } from '../browserApi/storage';

import {
    type StatisticsStorageShape,
    type AddStatisticsDataBase,
    type AddStatisticsDataTraffic,
    type StatisticsLocationStorage,
    type StatisticsAccountStorage,
    type StatisticsData,
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
     * @param data Data to add.
     */
    addTraffic(data: AddStatisticsDataTraffic): Promise<void>;

    /**
     * Starts tracking connection duration.
     *
     * @param data Data about account and location.
     */
    startDuration(data: AddStatisticsDataBase): Promise<void>;

    /**
     * Updates tracking data of connection duration.
     *
     * @param data Data about account and location.
     */
    updateDuration(data: AddStatisticsDataBase): Promise<void>;

    /**
     * Ends tracking connection duration.
     *
     * @param data Data about account and location.
     */
    endDuration(data: AddStatisticsDataBase): Promise<void>;
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
 * FIXME: Add jsdoc
 * FIXME: Add first collection date
 */
export class StatisticsStorage implements StatisticsStorageInterface {
    /**
     * Separator for date keys.
     */
    private static readonly DATE_SEPARATOR = '-';

    /**
     * Key for statistics storage in local storage.
     */
    private static readonly STATISTICS_STORAGE_KEY = 'statistics.storage';

    /**
     * Default statistics data object.
     * Used when the statistics data is not found in hourly / daily / total storage.
     */
    private static readonly DEFAULT_STATISTICS_DATA: StatisticsData = {
        downloaded: 0,
        uploaded: 0,
        duration: 0,
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
     * Browser local storage.
     */
    private storage: StorageInterface;

    /**
     * Object that contains all statistics data.
     *
     * Initialized in {@link init} method.
     */
    private statistics!: StatisticsStorageShape;

    /**
     * Constructor.
     */
    constructor({ storage }: StatisticsStorageParameters) {
        this.storage = storage;
    }

    /**
     * Initializes the statistics storage.
     */
    public init = async (): Promise<void> => {
        try {
            log.info('Statistics storage ready');
            await this.gainStatistics();
            await this.updateStaleStatistics();
        } catch (e) {
            log.error('Unable to initialize statistics storage, due to error:', e);
        }
    };

    /**
     * Saves the statistics storage to local storage.
     */
    private async saveStatistics(): Promise<void> {
        try {
            await this.storage.set<StatisticsStorageShape>(
                StatisticsStorage.STATISTICS_STORAGE_KEY,
                this.statistics,
            );
        } catch (e) {
            log.error('Unable to save statistics storage, due to error:', e);
        }
    }

    /**
     * Reads the statistics storage from local storage.
     * If not found, initializes it with an empty object and saves it.
     */
    private async gainStatistics(): Promise<void> {
        const storageStatistics = await this.storage.get<StatisticsStorageShape>(
            StatisticsStorage.STATISTICS_STORAGE_KEY,
        );

        if (!storageStatistics) {
            this.statistics = {};
            await this.saveStatistics();
        } else {
            this.statistics = storageStatistics;
        }
    }

    /**
     * Updates stale statistics by:
     * 1. Distributing the duration tracker to hourly / daily / total statistics
     *    (see {@link distributeDuration} for detailed explanation),
     * 2. Moving hourly statistics to daily statistics if 24 hours passed
     *    (see {@link moveHourlyStatistics} for detailed explanation),
     * 3. Moving daily statistics to total statistics if 30 days passed
     *    (see {@link moveDailyStatistics} for detailed explanation);
     *
     * Note: Order of operations described above is important,
     * because we are moving to the top of the statistics period.
     */
    private async updateStaleStatistics(): Promise<void> {
        // create before to make consistent calculations
        const now = Date.now();

        Object.values(this.statistics).forEach((accountStorage) => {
            Object.values(accountStorage!).forEach((locationStorage) => {
                StatisticsStorage.distributeDuration(locationStorage!, now);
                StatisticsStorage.moveHourlyStatistics(locationStorage!, now);
                StatisticsStorage.moveDailyStatistics(locationStorage!, now);
            });
        });

        await this.saveStatistics();
    }

    /**
     * Distributes the duration tracker of location storage to hourly / daily / total statistics.
     *
     * @see {@link distributeDurationAcrossPeriod} for more details how distribution works.
     *
     * @param locationStorage Location storage.
     * @param timestamp Timestamp to compare with.
     */
    private static distributeDuration(locationStorage: StatisticsLocationStorage, timestamp: number): void {
        // skip if duration tracker is not set
        const { durationTracker } = locationStorage;
        if (!durationTracker) {
            return;
        }

        const { total } = locationStorage;
        const { startedTimestamp, lastUpdatedTimestamp } = durationTracker;

        // eslint-disable-next-line no-param-reassign
        const deleteDurationTracker = () => delete locationStorage.durationTracker;

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
            total.duration += totalDuration;
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
        StatisticsStorage.distributeDurationAcrossPeriod(locationStorage, dailyStart, dailyEnd, false);

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
        StatisticsStorage.distributeDurationAcrossPeriod(locationStorage, hourlyStart, hourlyEnd, true);

        // delete tracker after tracker is distributed
        deleteDurationTracker();
    }

    /**
     * Distributes the duration across hourly / daily statistics.
     *
     * @param locationStorage Location storage.
     * @param start Start timestamp.
     * @param end End timestamp.
     * @param isHourly Whether to distribute across hourly or daily statistics.
     */
    private static distributeDurationAcrossPeriod(
        locationStorage: StatisticsLocationStorage,
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
            const data = StatisticsStorage.getPeriodStatistics(locationStorage, isHourly, new Date(current));

            const durationToAdd = Math.min(current + increment, end) - current;
            data.duration += durationToAdd;
            current += durationToAdd;

            if (isFirstIteration) {
                increment = step;
                isFirstIteration = false;
            }
        }
    }

    /**
     * Moves hourly statistics by traversing the each available hourly data
     * and if for given hour 24 hours is passed, it moves the statistics
     * to according daily statistics (`YYYY-MM-DD-HH` -> `YYYY-MM-DD`).
     *
     * @param locationStorage Location statistics storage.
     * @param timestamp Timestamp to compare with.
     */
    private static moveHourlyStatistics(locationStorage: StatisticsLocationStorage, timestamp: number): void {
        const { hourly } = locationStorage;

        Object.entries(hourly).forEach(([hourlyKey, hourlyData]) => {
            // convert key to date
            const date = StatisticsStorage.keyToDate(hourlyKey);

            // delete and skip if date is not valid
            if (!date) {
                delete hourly[hourlyKey];
                return;
            }

            // skip if 24 hours is not passed, inclusive (>=)
            // to store last 24 hours data, instead of last 23 hours
            if (date.getTime() >= StatisticsStorage.getHourlyBorderTimestamp(timestamp)) {
                return;
            }

            // move hourly data to daily data
            const { downloaded, uploaded, duration } = hourlyData!;
            const dailyData = StatisticsStorage.getPeriodStatistics(locationStorage, false, date);
            dailyData.downloaded += downloaded;
            dailyData.uploaded += uploaded;
            dailyData.duration += duration;

            // remove hourly data after moving
            delete hourly[hourlyKey];
        });
    }

    /**
     * Moves daily statistics by traversing the each available daily data
     * and if for given date 30 days is passed, it moves the statistics
     * to total statistics (`YYYY-MM-DD` -> `total`).
     *
     * @param locationStorage Location statistics storage.
     * @param timestamp Timestamp to compare with.
     */
    private static moveDailyStatistics(locationStorage: StatisticsLocationStorage, timestamp: number): void {
        const { daily, total } = locationStorage;

        Object.entries(daily).forEach(([dailyKey, dailyData]) => {
            // convert key to date
            const date = StatisticsStorage.keyToDate(dailyKey);

            // delete and skip if date is not valid
            if (!date) {
                delete daily[dailyKey];
                return;
            }

            // skip if 30 days is not passed, inclusive (>=)
            // to store 30 days data, instead of 29 days
            if (date.getTime() >= StatisticsStorage.getDailyBorderTimestamp(timestamp)) {
                return;
            }

            // move daily data to total data
            const { downloaded, uploaded, duration } = dailyData!;
            total.downloaded += downloaded;
            total.uploaded += uploaded;
            total.duration += duration;

            // remove daily data after moving
            delete daily[dailyKey];
        });
    }

    /**
     * Gets location storage for the given account ID and location ID.
     * If not found, creates a new one.
     *
     * @param data Data about account and location.
     *
     * @returns Location storage.
     */
    private getLocationStorage({
        accountId,
        locationId,
    }: AddStatisticsDataBase): StatisticsLocationStorage {
        let accountStorage: StatisticsAccountStorage;
        if (this.statistics[accountId]) {
            accountStorage = this.statistics[accountId]!;
        } else {
            accountStorage = {};
            this.statistics[accountId] = accountStorage;
        }

        let locationStorage: StatisticsLocationStorage;
        if (accountStorage[locationId]) {
            locationStorage = accountStorage[locationId]!;
        } else {
            locationStorage = {
                hourly: {},
                daily: {},
                total: {
                    ...StatisticsStorage.DEFAULT_STATISTICS_DATA,
                },
            };
            accountStorage[locationId] = locationStorage;
        }

        return locationStorage;
    }

    /**
     * Adds traffic statistics to current date and hour by account and location.
     *
     * @param data Data about account, location and traffic.
     */
    public addTraffic = async (data: AddStatisticsDataTraffic): Promise<void> => {
        const locationStorage = this.getLocationStorage(data);
        const hourlyData = StatisticsStorage.getPeriodStatistics(locationStorage, true);

        const { downloaded, uploaded } = data;
        hourlyData.downloaded += downloaded;
        hourlyData.uploaded += uploaded;
        await this.saveStatistics();
    };

    /**
     * Starts tracking connection duration.
     *
     * @param data Data about account and location.
     */
    public startDuration = async (data: AddStatisticsDataBase): Promise<void> => {
        const locationStorage = this.getLocationStorage(data);

        const now = Date.now();
        if (!locationStorage.durationTracker) {
            locationStorage.durationTracker = {
                startedTimestamp: now,
                lastUpdatedTimestamp: now,
            };
        } else {
            locationStorage.durationTracker.startedTimestamp = now;
            locationStorage.durationTracker.lastUpdatedTimestamp = now;
        }

        await this.saveStatistics();
    };

    /**
     * Updates `lastUpdatedTimestamp` of the duration tracker.
     *
     * @param data Data about account and location.
     *
     * @returns Location storage with updated duration tracker or null if not found.
     */
    private updateDurationTracker(data: AddStatisticsDataBase): StatisticsLocationStorage | null {
        const locationStorage = this.getLocationStorage(data);
        if (!locationStorage.durationTracker) {
            log.error('Missing duration tracker for location');
            return null;
        }

        locationStorage.durationTracker.lastUpdatedTimestamp = Date.now();
        return locationStorage;
    }

    /**
     * Updates tracking data of connection duration.
     *
     * @param data Data about account and location.
     */
    public updateDuration = async (data: AddStatisticsDataBase): Promise<void> => {
        const locationStorage = this.updateDurationTracker(data);

        // save if updated
        if (locationStorage) {
            await this.saveStatistics();
        }
    };

    /**
     * Ends tracking connection duration.
     *
     * @param data Data about account and location.
     */
    public endDuration = async (data: AddStatisticsDataBase): Promise<void> => {
        const locationStorage = this.updateDurationTracker(data);

        // distribute duration to statistics and save if updated
        if (locationStorage) {
            StatisticsStorage.distributeDuration(locationStorage, Date.now());
            await this.saveStatistics();
        }
    };

    /**
     * Gets statistics data for the given hourly / daily -> datetime / date for a given date.
     * If not found, creates a new one.
     *
     * @param locationStorage Location storage.
     * @param isHourly Whether to get hourly or daily statistics.
     * @param date Date to get statistics for. If not provided, current date is used.
     *
     * @returns Statistics data for given date.
     */
    private static getPeriodStatistics(
        { hourly, daily }: StatisticsLocationStorage,
        isHourly: boolean,
        date = new Date(),
    ): StatisticsData {
        const dateKey = StatisticsStorage.dateToKey(isHourly, date);
        const periodStorage = isHourly ? hourly : daily;

        let periodData: StatisticsData;
        if (periodStorage[dateKey]) {
            periodData = periodStorage[dateKey]!;
        } else {
            periodData = { ...StatisticsStorage.DEFAULT_STATISTICS_DATA };
            periodStorage[dateKey] = periodData;
        }

        return periodData;
    }

    /**
     * Gets dash separated storage key for the current date in UTC format.
     *
     * @example
     * ```ts
     * StatisticsStorage.dateToKey(false); // 2025-05-19
     * StatisticsStorage.dateToKey(true); // 2025-05-19-12
     * StatisticsStorage.dateToKey(false, new Date('2023-04-01T12:00:00Z')); // 2023-04-01
     * StatisticsStorage.dateToKey(true, new Date('2023-04-01T12:00:00Z')); // 2023-04-01-12
     * ```
     *
     * @param includeHours Whether to include hours in the date string.
     * @param date Date to convert. If not provided, current date is used.
     *
     * @returns Key of current date in UTC format.
     */
    public static dateToKey(includeHours: boolean, date = new Date()): string {
        const parts = [
            date.getUTCFullYear(),
            date.getUTCMonth() + 1,
            date.getUTCDate(),
        ];

        if (includeHours) {
            parts.push(date.getUTCHours());
        }

        return parts
            .map((part) => String(part).padStart(2, '0'))
            .join(StatisticsStorage.DATE_SEPARATOR);
    }

    /**
     * Converts a date key to a Date object.
     * The key should be in the format `'YYYY-MM-DD'` or `'YYYY-MM-DD-HH'`.
     * If hour is not provided, it will be set to 0.
     *
     * @example
     * ```ts
     * StatisticsStorage.keyToDate('2023-04-01'); // 2023-04-01T00:00:00.000Z
     * StatisticsStorage.keyToDate('2023-04-01-12'); // 2023-04-01T12:00:00.000Z
     * StatisticsStorage.keyToDate('2023-04-01-12-30'); // null
     * ```
     *
     * @param key Key to convert.
     *
     * @returns Date object or null if the key is not valid.
     */
    public static keyToDate(key: string): Date | null {
        const parts = key
            .split(StatisticsStorage.DATE_SEPARATOR)
            .map((part) => parseInt(part, 10));

        if (parts.length < 3 || parts.length > 4 || parts.some((part) => Number.isNaN(part))) {
            log.error(`Key "${key}" is not valid date key`);
            return null;
        }

        const [year, month, day, hour = 0] = parts;

        return new Date(Date.UTC(year, month - 1, day, hour));
    }

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
