import { ONE_DAY_MS } from '../../common/constants';
import { log } from '../../common/logger';

import { type StatisticsProviderInterface } from './StatisticsProvider';
import { type StatisticsStorageInterface } from './StatisticsStorage';
import {
    StatisticsRange,
    type StatisticsByRange,
    type StatisticsData,
    type StatisticsDataTuple,
    type StatisticsDataUsage,
    type StatisticsLocationsStorage,
    type StatisticsLocationData,
    type StatisticsSessionTuple,
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
     * Retrieves statistics data for the given range.
     *
     * @param range The range for which statistics data is needed.
     *
     * @returns Stats data for the given range.
     */
    getStatsByRange(range: StatisticsRange): Promise<StatisticsByRange>

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
     * Storage for statistics.
     */
    private statisticsStorage: StatisticsStorageInterface;

    /**
     * Statistics provider.
     */
    private provider: StatisticsProviderInterface;

    /**
     * Constructor.
     */
    constructor({
        statisticsStorage,
        provider,
    }: StatisticsServiceParameters) {
        this.statisticsStorage = statisticsStorage;
        this.provider = provider;
    }

    /** @inheritdoc */
    public init = async (): Promise<void> => {
        try {
            this.provider.init();
            await this.statisticsStorage.init();
            log.info('Statistics service ready');
        } catch (e) {
            log.error('Unable to initialize statistics service, due to error:', e);
        }
    };

    /**
     * Queries the duration of sessions for the given range.
     *
     * @param sessions Sessions to query.
     * @param totalDurationMs Total duration in milliseconds for sessions that are older than 30 days.
     * @param range The range for which statistics data is needed.
     *
     * @returns Total duration in milliseconds for the given range.
     */
    private static querySessionsDuration(
        sessions: StatisticsSessionTuple[],
        totalDurationMs: number,
        range: StatisticsRange,
    ): number {
        let durationMs = 0;

        const threshold = StatisticsService.getRangeThreshold(range);

        // move backwards because last sessions are the most recent ones
        for (let i = sessions.length - 1; i >= 0; i -= 1) {
            const [startedTimestamp, endedTimestamp] = sessions[i];

            if (endedTimestamp <= threshold) {
                // case 1: if session ended before threshold, we can stop processing,
                // because all next iteration sessions will be older than threshold
                break;
            } else if (startedTimestamp < threshold && endedTimestamp > threshold) {
                // case 2: session is partially fits the threshold,
                // we can add only the part of the session that is after threshold
                durationMs += endedTimestamp - threshold;
            } else {
                // case 3: session is fully fits the threshold,
                // we can add full duration to total duration
                durationMs += endedTimestamp - startedTimestamp;
            }
        }

        // add all sessions duration for AllTime range
        if (range === StatisticsRange.AllTime) {
            durationMs += totalDurationMs;
        }

        return durationMs;
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
        const {
            hourly,
            daily,
            total,
            sessions,
            totalDurationMs,
            lastSession,
        } = locationData;

        const data: StatisticsData = {
            downloadedBytes: 0,
            uploadedBytes: 0,
            durationMs: StatisticsService.querySessionsDuration(
                sessions,
                totalDurationMs,
                range,
            ),
        };

        if (lastSession) {
            const [startedTimestamp] = lastSession;
            data.connectionStartedTimestamp = startedTimestamp;
        }

        const addStatisticsData = ([downloadedBytes, uploadedBytes]: StatisticsDataTuple) => {
            data.downloadedBytes += downloadedBytes;
            data.uploadedBytes += uploadedBytes;
        };

        // add all hourly data for all cases,
        // hourly data stores stats for last 24 hours
        hourly.forEach(([, hourData]) => addStatisticsData(hourData));

        // add only some daily data if range is Days7,
        // daily data stores stats older than 24 hours and up to 30 days
        if (range === StatisticsRange.Days7) {
            let addedDays = 0;
            for (let i = 0; i < daily.length; i += 1) {
                const [dateKey, dayData] = daily[i];

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
            daily.forEach(([, dayData]) => addStatisticsData(dayData));
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
    ): Pick<StatisticsByRange, 'total' | 'locations'> {
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

                // if live connection is found on this location,
                // we should set it to total stats also, because
                // there can be only one live connection at a time
                if (data.connectionStartedTimestamp) {
                    total.connectionStartedTimestamp = data.connectionStartedTimestamp;
                }

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
    public getStatsByRange = async (range: StatisticsRange): Promise<StatisticsByRange> => {
        const accountStatistics = await this.statisticsStorage.getStatistics();
        const { startedTimestamp, locations } = accountStatistics;

        return {
            startedTimestamp,
            ...StatisticsService.queryLocationsStorage(locations, range),
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

    /**
     * Calculates the threshold timestamp for the given range.
     *
     * @param range The range for which the threshold is needed.
     *
     * @returns The threshold timestamp in milliseconds.
     */
    private static getRangeThreshold(range: StatisticsRange): number {
        const now = Date.now();

        switch (range) {
            case StatisticsRange.Hours24:
                return now - ONE_DAY_MS;
            case StatisticsRange.Days7:
                return now - 7 * ONE_DAY_MS;
            case StatisticsRange.Days30:
                return now - 30 * ONE_DAY_MS;
            case StatisticsRange.AllTime:
                // For AllTime, we do not filter by date, so we return 0
                return 0;
            default:
                throw new Error(`Unknown statistics range: ${range}`);
        }
    }
}
