/**
 * Tuple representing statistics data.
 * It contains:
 * 1. Number of bytes downloaded
 * 2. Number of bytes uploaded
 */
export type StatisticsDataTuple = [number, number];

/**
 * Tuple representing statistics both data and duration.
 * It contains:
 * 1. Number of bytes downloaded
 * 2. Number of bytes uploaded
 * 3. Duration of connection
 */
export type StatisticsTuple = [number, number, number];

/**
 * Tuple representing hourly based statistics data.
 * It contains:
 * 1. Datetime in the format `'YYYY-MM-DD-HH'` (UTC+0)
 * 2. Statistics data
 */
export type StatisticsHourlyTuple = [string, StatisticsDataTuple];

/**
 * Tuple representing connection session data.
 * It contains:
 * 1. Timestamp when the session started
 * 2. Timestamp when the session ended
 */
export type StatisticsSessionTuple = [number, number];

/**
 * Statistics data for a specific location.
 */
export interface StatisticsLocationData {
    /**
     * Hourly statistics data.
     * It stores statistics data for every hour of the past 30 days.
     */
    hourly: StatisticsHourlyTuple[];

    /**
     * Connection sessions data.
     * It stores connection sessions data for the past 30 days.
     */
    sessions: StatisticsSessionTuple[];

    /**
     * Total statistics data.
     * It stores the total statistics data and duration for dates and sessions that are older than 30 days.
     */
    total: StatisticsTuple;

    /**
     * Last connection session data.
     */
    lastSession?: StatisticsSessionTuple;
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

    /**
     * Timestamp when current connection is started.
     * This field is presented in case if there is an active connection.
     */
    connectionStartedTimestamp?: number;
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
export interface StatisticsByRange {
    /**
     * Flag indicating whether the statistics collection is disabled or not.
     */
    isDisabled: boolean;

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
