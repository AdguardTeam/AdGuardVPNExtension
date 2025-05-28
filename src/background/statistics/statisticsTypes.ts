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
 * Hourly based statistics data.
 * It stores statistics data for past 24 hours.
 */
export interface StatisticsHourlyStorage {
    /**
     * Datetime to statistics data mapping.
     * The datetime is in the format `'YYYY-MM-DD-HH'` (UTC+0).
     *
     * Note: Always check if the value is `undefined` before using it.
     */
    [dateTime: string]: StatisticsData;
}

/**
 * Daily based statistics data.
 * It stores statistics data for past 30 days.
 */
export interface StatisticsDailyStorage {
    /**
     * Date to statistics data mapping.
     * The date is in the format `'YYYY-MM-DD'` (UTC+0).
     *
     * Note: Always check if the value is `undefined` before using it.
     */
    [date: string]: StatisticsData;
}

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
     * It stores statistics data for past 24 hours.
     */
    hourly: StatisticsHourlyStorage;

    /**
     * Daily based statistics data.
     * It stores statistics data for past 30 days.
     */
    daily: StatisticsDailyStorage;

    /**
     * Total statistics data.
     * It stores statistics data for dates that are older than 30 days.
     */
    total: StatisticsData;

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
 * Statistics sent when {@link StatisticsRange} is changed, and data for that range is needed.
 */
export interface RangeStatistics {
    /**
     * Summarized statistics data for {@link locations}.
     */
    total: StatisticsData;

    /**
     * List of statistics data for all locations.
     */
    locations: StatisticsDataUsage[];
}

/**
 * All information about statistics for a specific account.
 */
export interface FullStatistics extends RangeStatistics {
    /**
     * Timestamp when the statistics collection started.
     */
    startedTimestamp: number;

    /**
     * Currently selected statistics range.
     */
    range: StatisticsRange;
}
