import { log } from '../../common/logger';
import { type StorageInterface } from '../browserApi/storage';
import { type CredentialsInterface } from '../credentials/Credentials';

import { type StatisticsProviderInterface } from './StatisticsProvider';
import {
    StatisticsRange,
    type RangeAccountStatistics,
    type AllAccountStatistics,
    type StatisticsAccountStorage,
    type StatisticsData,
    type StatisticsLocationStorage,
    type StatisticsDataUsage,
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
     * Retrieves full statistics information for the current account.
     *
     * @returns Promise that resolves to the all statistics data,
     * or `null` if user is not authenticated or stats didn't started collecting yet.
     */
    getAllStatistics(): Promise<AllAccountStatistics | null>;

    /**
     * Updates range in local storage and retrieves statistics data
     * for the given range for the current account.
     *
     * @param range The range for which statistics data is needed.
     *
     * @returns Promise that resolves to the refreshed statistics data,
     * or `null` if user is not authenticated or stats didn't started collecting yet.
     */
    getRangeStatistics(range: StatisticsRange): Promise<RangeAccountStatistics | null>

    /**
     * Clears all statistics for the current account.
     *
     * WARNING: This method will delete all statistics data,
     * make sure that you know what you are doing before calling it.
     *
     * @returns True if the statistics were cleared, false otherwise.
     */
    clearStatistics(): Promise<boolean>;
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
     * Statistics provider.
     */
    provider: StatisticsProviderInterface;

    /**
     * Credentials instance.
     */
    credentials: CredentialsInterface;
}

/**
 * FIXME: Add jsdoc description.
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
     * Statistics provider.
     */
    private provider: StatisticsProviderInterface;

    /**
     * Credentials instance.
     */
    private credentials: CredentialsInterface;

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
        provider,
        credentials,
    }: StatisticsServiceParameters) {
        this.storage = storage;
        this.provider = provider;
        this.credentials = credentials;
    }

    /**
     * Initializes the statistics service.
     */
    public init = async (): Promise<void> => {
        try {
            log.info('Statistics service ready');
            await this.provider.init();
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
     * Queries the location storage for statistics data for the given range.
     *
     * @param locationStorage Location storage to query.
     * @param range The range for which statistics data is needed.
     *
     * @returns Statistics data for the given range.
     */
    private queryLocationStorage(
        locationStorage: StatisticsLocationStorage,
        range: StatisticsRange,
    ): StatisticsData {
        const data: StatisticsData = {
            downloaded: 0,
            uploaded: 0,
            duration: 0,
        };

        const { hourly, daily, total } = locationStorage;

        const addStatisticsData = ({ downloaded, uploaded, duration }: StatisticsData) => {
            data.downloaded += downloaded;
            data.uploaded += uploaded;
            data.duration += duration;
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
     * Queries the account storage for statistics data for the given range.
     *
     * @param accountStorage Account storage to query.
     * @param range The range for which statistics data is needed.
     *
     * @returns Statistics data for the given range.
     */
    private queryAccountStorage(
        accountStorage: StatisticsAccountStorage,
        range: StatisticsRange,
    ): RangeAccountStatistics {
        const total: StatisticsData = {
            downloaded: 0,
            uploaded: 0,
            duration: 0,
        };

        const locations = Object.entries(accountStorage).map(
            ([locationId, locationStorage]): StatisticsDataUsage => {
                const data = this.queryLocationStorage(locationStorage, range);

                total.downloaded += data.downloaded;
                total.uploaded += data.uploaded;
                total.duration += data.duration;

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

    /**
     * Retrieves full statistics information for the current account.
     *
     * @returns Promise that resolves to the all statistics data,
     * or `null` if user is not authenticated or stats didn't started collecting yet.
     */
    public getAllStatistics = async (): Promise<AllAccountStatistics | null> => {
        const accountId = await this.credentials.getUsername();

        // return null if user is not authenticated
        if (!accountId) {
            return null;
        }

        // FIXME: Probably we need to request to update stats before getting it
        const accountStatistics = this.provider.getAccountStatistics(accountId);

        // return null if stats didn't started collecting yet
        if (!accountStatistics) {
            return null;
        }

        const { startedTimestamp, accountStorage } = accountStatistics;

        let rangeAccountStatistics: RangeAccountStatistics;
        if (accountStorage) {
            rangeAccountStatistics = this.queryAccountStorage(accountStorage, this.range);
        } else {
            // collection started but no data yet, fallback to empty stats
            rangeAccountStatistics = {
                total: {
                    downloaded: 0,
                    uploaded: 0,
                    duration: 0,
                },
                locations: [],
            };
        }

        return {
            startedTimestamp,
            range: this.range,
            ...rangeAccountStatistics,
        };
    };

    /**
     * Updates range in local storage and retrieves statistics data
     * for the given range for the current account.
     *
     * @param range The range for which statistics data is needed.
     *
     * @returns Promise that resolves to the refreshed statistics data,
     * or `null` if user is not authenticated or stats didn't started collecting yet.
     */
    public getRangeStatistics = async (range: StatisticsRange): Promise<RangeAccountStatistics | null> => {
        await this.saveRange(range);
        const allStatistics = await this.getAllStatistics();

        // return null if user is not authenticated
        // or if stats didn't started collecting yet
        if (!allStatistics) {
            return null;
        }

        const { total, locations } = allStatistics;

        return {
            total,
            locations,
        };
    };

    /**
     * Clears all statistics for the current account.
     *
     * WARNING: This method will delete all statistics data,
     * make sure that you know what you are doing before calling it.
     *
     * @returns True if the statistics were cleared, false otherwise.
     */
    public clearStatistics = async (): Promise<boolean> => {
        const accountId = await this.credentials.getUsername();

        // do nothing if user is not authenticated
        if (!accountId) {
            return false;
        }

        await this.provider.clearAccountStatistics(accountId);
        return true;
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

        return date >= sevenDaysAgo;
    }
}
