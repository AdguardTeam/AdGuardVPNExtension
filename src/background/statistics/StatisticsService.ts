import { log } from '../../common/logger';
import { type StorageInterface } from '../browserApi/storage';

import { type StatisticsProviderInterface } from './StatisticsProvider';
import { type StatisticsStorageInterface } from './StatisticsStorage';
import {
    StatisticsRange,
    type RangeStatistics,
    type FullStatistics,
    type StatisticsData,
    type StatisticsDataUsage,
    type StatisticsLocationsStorage,
    type StatisticsLocationData,
} from './statisticsTypes';
import { keyToDate } from './utils';

/**
 * Statistics service interface.
 */
export interface StatisticsServiceInterface {
    /**
     * Initializes the statistics service.
     */
    init(): Promise<void>;

    /**
     * Retrieves full statistics information.
     *
     * @returns All statistics data.
     */
    getAllStatistics(): Promise<FullStatistics>;

    /**
     * Updates range in local storage and retrieves statistics data for the given range.
     *
     * @param range The range for which statistics data is needed.
     *
     * @returns Range statistics data.
     */
    getRangeStatistics(range: StatisticsRange): Promise<RangeStatistics>

    /**
     * Clears all statistics.
     *
     * WARNING: This method will delete all statistics data,
     * make sure that you know what you are doing before calling it.
     */
    clearStatistics(): Promise<void>;
}

/**
 * Constructor parameters for {@link StatisticsService}.
 */
export interface StatisticsServiceParameters {
    /**
     * Browser local storage.
     */
    storage: StorageInterface;

    /**
     * Storage for statistics.
     */
    statisticsStorage: StatisticsStorageInterface;

    /**
     * Statistics provider.
     */
    provider: StatisticsProviderInterface;
}

/**
 * Statistics service.
 * This class is responsible for statistics data processing and aggregation to UI.
 * It used to retrieve statistics data from the provider by converting
 * raw statistics data into a more user-friendly format depending on the selected range.
 */
export class StatisticsService implements StatisticsServiceInterface {
    /**
     * Default statistics range.
     */
    private static readonly DEFAULT_RANGE: StatisticsRange = StatisticsRange.Days7;

    /**
     * Key used to store statistics range in local storage.
     */
    private static readonly RANGE_KEY = 'statistics.range';

    /**
     * Browser local storage.
     */
    private storage: StorageInterface;

    /**
     * Storage for statistics.
     */
    private statisticsStorage: StatisticsStorageInterface;

    /**
     * Statistics provider.
     */
    private provider: StatisticsProviderInterface;

    /**
     * Currently selected statistics range.
     *
     * Initialized in {@link init} method.
     */
    private range: StatisticsRange;

    /**
     * Constructor.
     */
    constructor({
        storage,
        statisticsStorage,
        provider,
    }: StatisticsServiceParameters) {
        this.storage = storage;
        this.statisticsStorage = statisticsStorage;
        this.provider = provider;
    }

    /** @inheritdoc */
    public init = async (): Promise<void> => {
        try {
            log.info('Statistics service ready');
            await this.statisticsStorage.init();
            await this.gainRange();
        } catch (e) {
            log.error('Unable to initialize statistics service, due to error:', e);
        }
    };

    /**
     * Saves the statistics range to local storage.
     *
     * @param newRange The new statistics range to save.
     */
    private async saveRange(newRange: StatisticsRange): Promise<void> {
        this.range = newRange;
        await this.storage.set<StatisticsRange>(StatisticsService.RANGE_KEY, this.range);
    }

    /**
     * Reads local storage and returns the statistics range,
     * if not found, returns the default range.
     *
     * @returns Promise that resolves to the statistics range.
     */
    private async gainRange(): Promise<void> {
        const storageRange = await this.storage.get<StatisticsRange>(StatisticsService.RANGE_KEY);

        if (!storageRange) {
            await this.saveRange(StatisticsService.DEFAULT_RANGE);
        } else {
            this.range = storageRange;
        }
    }

    /**
     * Queries the location data for statistics data for the given range.
     *
     * @param locationData Location storage to query.
     * @param range The range for which statistics data is needed.
     *
     * @returns Statistics data for the given range.
     */
    private static queryLocationData(
        locationData: StatisticsLocationData,
        range: StatisticsRange,
    ): StatisticsData {
        const data: StatisticsData = {
            downloadedBytes: 0,
            uploadedBytes: 0,
            durationMs: 0,
        };

        const { hourly, daily, total } = locationData;

        const addStatisticsData = ({ downloadedBytes, uploadedBytes, durationMs }: StatisticsData) => {
            data.downloadedBytes += downloadedBytes;
            data.uploadedBytes += uploadedBytes;
            data.durationMs += durationMs;
        };

        // add all hourly data for all cases,
        // hourly data stores stats for last 24 hours
        Object.values(hourly).forEach((hour) => addStatisticsData(hour));

        // add only some daily data if range is Days7,
        // daily data stores stats older than 24 hours and up to 30 days
        if (range === StatisticsRange.Days7) {
            let addedDays = 0;
            const dailyEntries = Object.entries(daily);
            for (let i = 0; i < dailyEntries.length; i += 1) {
                const [dateKey, dayData] = dailyEntries[i];

                if (StatisticsService.isDateInWeekRange(dateKey)) {
                    addStatisticsData(dayData);
                    addedDays += 1;
                }

                // stop if we already added 7 days
                if (addedDays >= 7) {
                    break;
                }
            }
        }

        // add all daily data if range is Days30 or AllTime,
        // daily data stores stats older than 24 hours and up to 30 days
        if (range === StatisticsRange.Days30 || range === StatisticsRange.AllTime) {
            Object.values(daily).forEach((day) => addStatisticsData(day));
        }

        // add total data if range is AllTime,
        // total data stores stats older than 30 days
        if (range === StatisticsRange.AllTime) {
            addStatisticsData(total);
        }

        return data;
    }

    /**
     * Queries the locations storage for statistics data for the given range.
     *
     * @param locationsStorage Account storage to query.
     * @param range The range for which statistics data is needed.
     *
     * @returns Statistics data for the given range.
     */
    private static queryLocationsStorage(
        locationsStorage: StatisticsLocationsStorage,
        range: StatisticsRange,
    ): RangeStatistics {
        const total: StatisticsData = {
            downloadedBytes: 0,
            uploadedBytes: 0,
            durationMs: 0,
        };

        const locations = Object.entries(locationsStorage).map(
            ([locationId, locationData]): StatisticsDataUsage => {
                const data = StatisticsService.queryLocationData(locationData, range);

                total.downloadedBytes += data.downloadedBytes;
                total.uploadedBytes += data.uploadedBytes;
                total.durationMs += data.durationMs;

                return {
                    locationId,
                    data,
                };
            },
        );

        return {
            total,
            locations,
        };
    }

    /** @inheritdoc */
    public getAllStatistics = async (): Promise<FullStatistics> => {
        const accountStatistics = await this.statisticsStorage.getStatistics();
        const { startedTimestamp, locations } = accountStatistics;

        return {
            startedTimestamp,
            range: this.range,
            ...StatisticsService.queryLocationsStorage(locations, this.range),
        };
    };

    /** @inheritdoc */
    public getRangeStatistics = async (range: StatisticsRange): Promise<RangeStatistics> => {
        await this.saveRange(range);

        const allStatistics = await this.getAllStatistics();
        const { total, locations } = allStatistics;

        return {
            total,
            locations,
        };
    };

    /** @inheritdoc */
    public clearStatistics = async (): Promise<void> => {
        await this.statisticsStorage.clearStatistics();
    };

    /**
     * Checks if the given date is in the last 7 days.
     *
     * @param dateKey Date key in the format `'YYYY-MM-DD'`.
     *
     * @returns True if the date is in the last 7 days,
     * false otherwise or if the date is invalid.
     */
    private static isDateInWeekRange(dateKey: string): boolean {
        const date = keyToDate(dateKey);

        // return false if the date is invalid
        if (!date) {
            return false;
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
        sevenDaysAgo.setUTCHours(0, 0, 0, 0);

        return date >= sevenDaysAgo;
    }
}
