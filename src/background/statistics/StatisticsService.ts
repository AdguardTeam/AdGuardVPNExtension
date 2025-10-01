import { ONE_DAY_MS } from '../../common/constants';
import { log } from '../../common/logger';

import { type StatisticsProviderInterface } from './StatisticsProvider';
import { type StatisticsStorageInterface } from './StatisticsStorage';
import {
    StatisticsRange,
    type StatisticsByRange,
    type StatisticsData,
    type StatisticsTuple,
    type StatisticsDataTuple,
    type StatisticsDataUsage,
    type StatisticsLocationsStorage,
    type StatisticsLocationData,
} from './statisticsTypes';
import { cropTimestampMinutes, keyToDate } from './utils';

/**
 * Query result for usage duration.
 */
type DurationQueryResult = Pick<StatisticsData, 'durationMs' | 'connectionStartedTimestamp'>;

/**
 * Query result for data usage.
 */
type DataQueryResult = Pick<StatisticsData, 'downloadedBytes' | 'uploadedBytes'>;

/**
 * Methods to forward to provider.
 */
type ProviderForwardedMethods = Pick<StatisticsProviderInterface, 'setIsDisabled'>;

/**
 * Statistics service interface.
 */
export interface StatisticsServiceInterface extends ProviderForwardedMethods {
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
     * Threshold time used for AllTime range.
     */
    private static readonly ALL_TIME_THRESHOLD = 0;

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
            await this.provider.init();
            await this.statisticsStorage.init();
            log.info('Statistics service ready');
        } catch (e) {
            log.error('Unable to initialize statistics service, due to error:', e);
        }
    };

    /**
     * Queries the duration of sessions for the given range.
     *
     * @param locationData Location data to query.
     * @param threshold Threshold timestamp to query for.
     *
     * @returns Total duration and optional current connection timestamp
     */
    private static queryDuration(
        locationData: StatisticsLocationData,
        threshold: number,
    ): DurationQueryResult {
        const { sessions, total, lastSession } = locationData;

        const result: DurationQueryResult = {
            durationMs: 0,
        };

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
                result.durationMs += endedTimestamp - threshold;
            } else {
                // case 3: session is fully fits the threshold,
                // we can add full duration to total duration
                result.durationMs += endedTimestamp - startedTimestamp;
            }
        }

        // add total duration if range is AllTime
        // total data stores stats older than 30 days
        if (threshold === StatisticsService.ALL_TIME_THRESHOLD) {
            const [,,totalDurationMs] = total;
            result.durationMs += totalDurationMs;
        }

        // add connection started timestamp if last session still active
        if (lastSession) {
            const [startedTimestamp] = lastSession;
            result.connectionStartedTimestamp = startedTimestamp;
        }

        return result;
    }

    /**
     * Queries the location data for statistics data for the given range.
     *
     * @param locationData Location data to query.
     * @param threshold Threshold timestamp to query for.
     *
     * @returns Statistics data for the given range.
     */
    private static queryData(
        locationData: StatisticsLocationData,
        threshold: number,
    ): DataQueryResult {
        const { hourly, total } = locationData;

        const result: DataQueryResult = {
            downloadedBytes: 0,
            uploadedBytes: 0,
        };

        const addStatisticsData = ([downloadedBytes, uploadedBytes]: StatisticsDataTuple | StatisticsTuple): void => {
            result.downloadedBytes += downloadedBytes;
            result.uploadedBytes += uploadedBytes;
        };

        const borderTimestamp = cropTimestampMinutes(threshold);

        hourly.forEach((hourlyData) => {
            const [key, data] = hourlyData;
            const date = keyToDate(key);

            // skip if date invalid or if it beyond threshold, not inclusive check we need
            // to keep last hour for cases if user timezone has daily savings time
            if (!date || date.getTime() < borderTimestamp) {
                return;
            }

            addStatisticsData(data);
        });

        // add total data if range is AllTime,
        // total data stores stats older than 30 days
        if (threshold === StatisticsService.ALL_TIME_THRESHOLD) {
            addStatisticsData(total);
        }

        return result;
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

        const threshold = StatisticsService.getRangeThreshold(range);

        const locations = Object.entries(locationsStorage).map(
            ([locationId, locationData]): StatisticsDataUsage => {
                const data = StatisticsService.queryData(locationData, threshold);
                const duration = StatisticsService.queryDuration(locationData, threshold);

                total.downloadedBytes += data.downloadedBytes;
                total.uploadedBytes += data.uploadedBytes;
                total.durationMs += duration.durationMs;

                // if live connection is found on this location,
                // we should set it to total stats also, because
                // there can be only one live connection at a time
                if (duration.connectionStartedTimestamp) {
                    total.connectionStartedTimestamp = duration.connectionStartedTimestamp;
                }

                return {
                    locationId,
                    data: {
                        ...data,
                        ...duration,
                    },
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
        const isDisabled = this.provider.getIsDisabled();

        return {
            isDisabled,
            startedTimestamp,
            ...StatisticsService.queryLocationsStorage(locations, range),
        };
    };

    /** @inheritdoc */
    public clearStatistics = async (): Promise<void> => {
        await this.statisticsStorage.clearStatistics();
    };

    /** @inheritdoc */
    public setIsDisabled = async (isDisabled: boolean): Promise<void> => {
        await this.provider.setIsDisabled(isDisabled);
    };

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
                return StatisticsService.ALL_TIME_THRESHOLD;
            default:
                throw new Error(`Unknown statistics range: ${range}`);
        }
    }
}
