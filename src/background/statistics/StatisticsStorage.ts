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
 * FIXME: Add tests
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
     * Updates stale statistics by moving them to the next period.
     *
     * @see {@link moveDurationTracker} - for duration tracker
     * @see {@link moveHourlyStatistics} - for hourly statistics
     * @see {@link moveDailyStatistics} - for daily statistics
     */
    private async updateStaleStatistics(): Promise<void> {
        // create before to make consistent calculations
        const now = Date.now();

        Object.values(this.statistics).forEach((accountStorage) => {
            Object.values(accountStorage!).forEach((locationStorage) => {
                this.moveDurationTracker(locationStorage!, now);
                this.moveHourlyStatistics(locationStorage!, now);
                this.moveDailyStatistics(locationStorage!, now);
            });
        });

        await this.saveStatistics();
    }

    /**
     * Moves duration tracker according to hourly / daily / total statistics.
     *
     * FIXME: Explanation comment
     *
     * @param locationStorage Location storage.
     * @param timestamp Timestamp to compare with.
     */
    private moveDurationTracker(locationStorage: StatisticsLocationStorage, timestamp: number): void {
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
        const duration = lastUpdatedTimestamp - startedTimestamp;
        if (duration <= 0) {
            deleteDurationTracker();
            return;
        }

        const dailyBorderDate = new Date(timestamp - StatisticsStorage.MOVE_DAILY_STATS_AFTER_MS);
        // dailyBorderDate.setUTCHours(0, 0, 0, 0); // FIXME: Is this needed?
        const dailyBorderTimestamp = dailyBorderDate.getTime();

        const hourlyBorderDate = new Date(timestamp - StatisticsStorage.MOVE_HOURLY_STATS_AFTER_MS);
        // hourlyBorderDate.setUTCMinutes(0, 0, 0); // FIXME: Is this needed?
        const hourlyBorderTimestamp = hourlyBorderDate.getTime();

        // Add to total
        const totalDuration = Math.min(dailyBorderTimestamp, lastUpdatedTimestamp) - startedTimestamp;
        if (totalDuration > 0) {
            total.duration += totalDuration;
        }

        // Spread across daily
        const dailyStart = Math.max(dailyBorderTimestamp, startedTimestamp);
        const dailyEnd = Math.min(hourlyBorderTimestamp, lastUpdatedTimestamp);
        const dailyDuration = dailyEnd - dailyStart;
        if (dailyDuration > 0) {
            let currentTimestamp = dailyStart;
            while (currentTimestamp < dailyEnd) {
                const dailyData = this.getPeriodStatistics(locationStorage, false, new Date(currentTimestamp));
                const durationToAdd = Math.min(currentTimestamp + ONE_DAY_MS, dailyEnd) - currentTimestamp;
                dailyData.duration += durationToAdd;
                currentTimestamp += durationToAdd;
            }
        }

        // Spread across hourly
        const hourlyStart = Math.max(hourlyBorderTimestamp, startedTimestamp);
        const hourlyEnd = Math.min(timestamp, lastUpdatedTimestamp);
        const hourlyDuration = hourlyEnd - hourlyStart;
        if (hourlyDuration > 0) {
            let currentTimestamp = hourlyStart;
            while (currentTimestamp < hourlyEnd) {
                const hourlyData = this.getPeriodStatistics(locationStorage, true, new Date(currentTimestamp));
                const durationToAdd = Math.min(currentTimestamp + ONE_HOUR_MS, hourlyEnd) - currentTimestamp;
                hourlyData.duration += durationToAdd;
                currentTimestamp += durationToAdd;
            }
        }

        deleteDurationTracker();
    }

    /**
     * Moves hourly statistics to daily statistics if 24 hours passed.
     *
     * @param locationStorage Location statistics storage.
     * @param timestamp Timestamp to compare with.
     */
    private moveHourlyStatistics(locationStorage: StatisticsLocationStorage, timestamp: number): void {
        const { hourly } = locationStorage;

        Object.entries(hourly).forEach(([hourlyKey, hourlyData]) => {
            // convert key to date
            const date = StatisticsStorage.keyToDate(hourlyKey);

            // delete and skip if date is not valid
            if (!date) {
                delete hourly[hourlyKey];
                return;
            }

            // skip if should not move to daily
            const shouldMoveToDaily = (timestamp - date.getTime()) > StatisticsStorage.MOVE_HOURLY_STATS_AFTER_MS;
            if (!shouldMoveToDaily) {
                return;
            }

            // add hourly data to daily data
            const { downloaded, uploaded, duration } = hourlyData!;
            const dailyData = this.getPeriodStatistics(locationStorage, false, date);
            dailyData.downloaded += downloaded;
            dailyData.uploaded += uploaded;
            dailyData.duration += duration;

            // remove hourly data
            delete hourly[hourlyKey];
        });
    }

    /**
     * Moves daily statistics to total statistics if 30 days passed.
     *
     * @param locationStorage Location statistics storage.
     * @param timestamp Timestamp to compare with.
     */
    private moveDailyStatistics(locationStorage: StatisticsLocationStorage, timestamp: number): void {
        const { daily, total } = locationStorage;

        Object.entries(daily).forEach(([dailyKey, dailyData]) => {
            // convert key to date
            const date = StatisticsStorage.keyToDate(dailyKey);

            // delete and skip if date is not valid
            if (!date) {
                delete daily[dailyKey];
                return;
            }

            // skip if should not move to total
            const shouldMoveToTotal = (timestamp - date.getTime()) > StatisticsStorage.MOVE_DAILY_STATS_AFTER_MS;
            if (!shouldMoveToTotal) {
                return;
            }

            // add daily data to total data
            const { downloaded, uploaded, duration } = dailyData!;
            total.downloaded += downloaded;
            total.uploaded += uploaded;
            total.duration += duration;

            // remove daily data
            delete daily[dailyKey];
        });
    }

    /**
     * Gets location storage for the given account and location.
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
     * Gets statistics data for the given account -> location -> hourly / daily -> datetime / date (now).
     * If not found, creates a new one.
     *
     * @param locationStorage Location storage.
     *
     * @returns Statistics data for the provided hour.
     */
    private getPeriodStatistics(
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
     * Adds traffic statistics to current date and hour by account and location.
     *
     * @param data Data about account, location and traffic.
     */
    public addTraffic = async (data: AddStatisticsDataTraffic): Promise<void> => {
        const locationStorage = this.getLocationStorage(data);
        const hourlyData = this.getPeriodStatistics(locationStorage, true);

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

        // move duration tracker to statistics and save if updated
        if (locationStorage) {
            this.moveDurationTracker(locationStorage, Date.now());
            await this.saveStatistics();
        }
    };

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
}
