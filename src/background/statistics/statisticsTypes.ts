/**
 * Tuple representing statistics data.
 * It contains:
 * 1. Number of bytes downloaded
 * 2. Number of bytes uploaded
 * 3. Duration of the connection in milliseconds
 */
export type StatisticsDataTuple = [number, number, number];

/**
 * Tuple representing hourly based statistics data.
 * It contains:
 * 1. Datetime in the format `'YYYY-MM-DD-HH'` (UTC+0)
 * 2. Statistics data
 */
export type StatisticsHourlyTuple = [string, StatisticsDataTuple];

/**
 * Tuple representing daily based statistics data.
 * It contains:
 * 1. Date in the format `'YYYY-MM-DD'` (UTC+0)
 * 2. Statistics data
 */
export type StatisticsDailyTuple = [string, StatisticsDataTuple];

/**
 * Duration tracker for the location statistics.
 */
export interface StatisticsDurationTracker {
    /**
     * Timestamp when the connection started.
     */
    startedTimestamp: number;

    /**
     * Last timestamp when connection was still active.
     */
    lastUpdatedTimestamp: number;
}

/**
 * Statistics data for a specific location.
 */
export interface StatisticsLocationData {
    /**
     * Hourly based statistics data.
     * It stores statistics data for past 25 hours.
     */
    hourly: StatisticsHourlyTuple[];

    /**
     * Daily based statistics data.
     * It stores statistics data for past 31 days.
     */
    daily: StatisticsDailyTuple[];

    /**
     * Total statistics data.
     * It stores statistics data for dates that are older than 31 days.
     */
    total: StatisticsDataTuple;

    /**
     * Duration tracker for location.
     */
    durationTracker?: StatisticsDurationTracker
}

/**
 * Map that contains statistics data for each location.
 */
export interface StatisticsLocationsStorage {
    /**
     * Location ID to location statistics data mapping.
     *
     * Note: Always check if the value is `undefined` before using it.
     */
    [locationId: string]: StatisticsLocationData;
}

/**
 * Statistics for all locations with started timestamp.
 */
export interface Statistics {
    /**
     * Map that contains statistics data for each location.
     */
    locations: StatisticsLocationsStorage;

    /**
     * Timestamp when the statistics collection started for this account.
     */
    startedTimestamp: number;
}

/**
 * Add traffic statistics data.
 */
export interface AddStatisticsDataTraffic {
    /**
     * Number of bytes downloaded.
     */
    downloadedBytes: number;

    /**
     * Number of bytes uploaded.
     */
    uploadedBytes: number;
}

/**
 * Statistics ranges.
 * Used to show statistics for different time periods.
 */
export enum StatisticsRange {
    Hours24 = 'hours24',
    Days7 = 'days7',
    Days30 = 'days30',
    AllTime = 'allTime',
}

/**
 * Usage statistics data.
 */
export interface StatisticsData {
    /**
     * Number of bytes downloaded.
     */
    downloadedBytes: number;

    /**
     * Number of bytes uploaded.
     */
    uploadedBytes: number;

    /**
     * Duration of the connection in milliseconds.
     */
    durationMs: number;
}

/**
 * Statistics data usage for a specific location.
 */
export interface StatisticsDataUsage {
    /**
     * Location ID to which the statistics data belong.
     */
    locationId: string;

    /**
     * Statistics data which contains the traffic and duration usage.
     */
    data: StatisticsData;
}

/**
 * Statistics data for a specific range.
 */
export interface RangeStatistics {
    /**
     * Timestamp when the statistics collection started.
     */
    startedTimestamp: number;

    /**
     * Summarized statistics data for {@link locations}.
     */
    total: StatisticsData;

    /**
     * List of statistics data for all locations.
     */
    locations: StatisticsDataUsage[];
}
