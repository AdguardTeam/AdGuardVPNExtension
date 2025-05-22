/**
 * Usage statistics data.
 */
export interface StatisticsData {
    /**
     * Number of bytes downloaded.
     */
    downloaded: number;

    /**
     * Number of bytes uploaded.
     */
    uploaded: number;

    /**
     * Duration of the connection in milliseconds.
     */
    duration: number;
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
     * Note: `undefined` is used to type guard if the data for the given datetime is not available.
     */
    [dateTime: string]: StatisticsData | undefined;
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
     * Note: `undefined` is used to type guard if the data for the given date is not available.
     */
    [date: string]: StatisticsData | undefined;
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
export interface StatisticsLocationStorage {
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
 * Statistics data for a specific account.
 */
export interface StatisticsAccountStorage {
    /**
     * Location ID to location statistics data mapping.
     *
     * Note: `undefined` is used to type guard if the data for the given location is not available.
     */
    [locationId: string]: StatisticsLocationStorage | undefined;
}

/**
 * Statistics storage for all accounts.
 */
export interface StatisticsStorageShape {
    /**
     * Account ID to account statistics data mapping.
     *
     * Note: `undefined` is used to type guard if the data for the given account is not available.
     */
    [accountId: string]: StatisticsAccountStorage | undefined;
}

/**
 * Map that contains when collection of statistics started for each account.
 */
export interface StatisticsStartedTimes {
    /**
     * Account ID to timestamp when the statistics collection started.
     *
     * Note: `undefined` is used to type guard if the data for the given account is not available.
     */
    [accountId: string]: number | undefined;
}

/**
 * Base data required for adding statistics.
 */
export interface AddStatisticsDataBase {
    /**
     * Account ID to which the statistics belong.
     */
    accountId: string;

    /**
     * Location ID to which the statistics belong.
     */
    locationId: string;
}

/**
 * Add traffic statistics data.
 */
export interface AddStatisticsDataTraffic extends AddStatisticsDataBase {
    /**
     * Number of bytes downloaded.
     */
    downloaded: number;

    /**
     * Number of bytes uploaded.
     */
    uploaded: number;
}

/**
 * Location storage and started time combined data for the given account.
 */
export interface StatisticsAccountData {
    /**
     * Timestamp when the statistics collection started.
     */
    startedTimestamp: number;

    /**
     * Account storage for the given account.
     */
    accountStorage: StatisticsAccountStorage | undefined;
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
