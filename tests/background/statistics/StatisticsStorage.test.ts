import { StatisticsStorage } from '../../../src/background/statistics/StatisticsStorage';
import {
    type StatisticsAccountsStorage,
    type StatisticsStartedTimes,
    type StatisticsData,
    type StatisticsDurationTracker,
    type StatisticsLocationData,
    type StatisticsDailyStorage,
    type StatisticsHourlyStorage,
} from '../../../src/background/statistics/statisticsTypes';
import { ONE_DAY_MS, ONE_HOUR_MS } from '../../../src/common/constants';

jest.mock('../../../src/common/logger');

const storageMock = {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
};

describe('StatisticsStorage', () => {
    let statisticsStorage: StatisticsStorage;
    const systemDate = new Date('2025-10-01T10:25:10Z');
    // @ts-expect-error - accessing private property
    const storageKey = StatisticsStorage.STATISTICS_STORAGE_KEY;
    // @ts-expect-error - accessing private property
    const startedTimesKey = StatisticsStorage.STARTED_TIMES_STORAGE_KEY;

    beforeEach(() => {
        statisticsStorage = new StatisticsStorage({
            storage: storageMock,
        });
        jest.useFakeTimers('modern').setSystemTime(systemDate);
    });

    afterEach(() => {
        storageMock.get.mockReset();
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    /**
     * Mock the storage with provided accounts storage and started times.
     *
     * @param accountsStorage Accounts storage to mock.
     * @param startedTimes Started times to mock.
     */
    const mockStorageAndInit = async (
        accountsStorage: StatisticsAccountsStorage | null = {},
        startedTimes: StatisticsStartedTimes | null = {},
    ) => {
        storageMock.get.mockImplementation(async (key: string) => {
            if (key === storageKey) {
                return accountsStorage;
            }

            if (key === startedTimesKey) {
                return startedTimes;
            }

            return null;
        });

        await statisticsStorage.init();
    };

    /**
     * Get statistics data for testing.
     *
     * @param downloadedBytes Number of bytes downloaded.
     * @param uploadedBytes Number of bytes uploaded (Default is `downloadedBytes`).
     * @param durationMs Duration in milliseconds (Default is `downloadedBytes`).
     *
     * @returns Statistics data.
     */
    const getData = (
        downloadedBytes: number,
        uploadedBytes = downloadedBytes,
        durationMs = downloadedBytes,
    ): StatisticsData => ({
        downloadedBytes,
        uploadedBytes,
        durationMs,
    });

    /**
     * Returns statistics data with duration in milliseconds.
     *
     * @returns Statistics data.
     */
    const getDuration = (durationMs: number): StatisticsData => ({
        downloadedBytes: 0,
        uploadedBytes: 0,
        durationMs,
    });

    describe('Initialization', () => {
        it('should initialize properly', async () => {
            await mockStorageAndInit(null, null);

            // 2 times - once for storage and once for started times
            expect(storageMock.get).toHaveBeenCalledTimes(2);
            expect(storageMock.get).toHaveBeenCalledWith(storageKey);
            expect(storageMock.get).toHaveBeenCalledWith(startedTimesKey);

            // 2 times - once for storage and once for started times
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenCalledWith(storageKey, {});
            expect(storageMock.set).toHaveBeenCalledWith(startedTimesKey, {});
        });

        it('should restore statistics from local storage', async () => {
            const storage: StatisticsAccountsStorage = {
                'account@adguard.com': {},
            };
            const startedTimes: StatisticsStartedTimes = {
                'account@adguard.com': 1,
            };

            await mockStorageAndInit(storage, startedTimes);

            // 2 times - once for storage and once for started times
            expect(storageMock.get).toHaveBeenCalledTimes(2);
            expect(storageMock.get).toHaveBeenCalledWith(startedTimesKey);
            expect(storageMock.get).toHaveBeenCalledWith(storageKey);

            // @ts-expect-error - accessing private property
            expect(statisticsStorage.accountsStorage).toEqual(storage);

            // @ts-expect-error - accessing private property
            expect(statisticsStorage.startedTimes).toEqual(startedTimes);
        });
    });

    describe('Duration tracker', () => {
        // @ts-expect-error - accessing private method
        const dailyBorderDateTimestamp = StatisticsStorage.getDailyBorderTimestamp(systemDate.getTime());
        // @ts-expect-error - accessing private method
        const hourlyBorderDateTimestamp = StatisticsStorage.getHourlyBorderTimestamp(systemDate.getTime());

        /**
         * Spams daily statistics for the given number of days.
         *
         * @param daysCount Number of days to spam.
         *
         * @returns Daily statistics storage with the given number of days.
         */
        const spamAllDays = (daysCount = 30) => {
            const days: StatisticsDailyStorage = {};
            for (let i = 0; i < daysCount; i += 1) {
                const date = new Date(dailyBorderDateTimestamp + i * ONE_DAY_MS);
                const dateKey = date.toISOString().split('T')[0];
                days[dateKey] = getDuration(ONE_DAY_MS);
            }
            return days;
        };

        /**
         * Spams hourly statistics for the given number of hours.
         *
         * @param hoursCount Number of hours to spam.
         *
         * @returns Hourly statistics storage with the given number of hours.
         */
        const spamAllHours = (hoursCount = 24) => {
            const hours: StatisticsHourlyStorage = {};
            for (let i = 0; i < hoursCount; i += 1) {
                const date = new Date(hourlyBorderDateTimestamp + i * ONE_HOUR_MS);
                const dateKey = date.toISOString().split('T')[0];
                const hourKey = String(date.getUTCHours()).padStart(2, '0');
                hours[`${dateKey}-${hourKey}`] = getDuration(ONE_HOUR_MS);
            }
            return hours;
        };

        /**
         * Test case for duration tracker.
         */
        type DurationTrackerTestCase = {
            /**
             * Duration tracker to test.
             */
            tracker: StatisticsDurationTracker;

            /**
             * Expected statistics after processing the tracker.
             */
            expected: StatisticsLocationData;
        };

        /**
         * There are 6 cases to test:
         * 1. started < lastUpdated < 30 days < 24 hours
         *    - lastUpdated - started should go to total duration
         * 2. 30 days < started < lastUpdated < 24 hours
         *    - lastUpdated - started should distributed across daily
         * 3. 30 days < 24 hours < started < lastUpdated
         *    - lastUpdated - started should distributed across hourly
         * 4. started < 30 days < lastUpdated < 24 hours
         *    - 30 days - started should go to total duration
         *    - lastUpdated - 30 days should distributed across daily
         * 5. 30 days < started < 24 hours < lastUpdated
         *    - 24 hours - started should distributed across daily
         *    - lastUpdated - 24 hours should distributed across hourly
         * 6. started < 30 days < 24 hours < lastUpdated
         *    - 30 days - started should go to total duration
         *    - 24 hours - 30 days should distributed across daily
         *    - lastUpdated - 24 hours should distributed across hourly
         *
         * Where:
         * - started: the time when connection was started
         * - lastUpdated: the last time when connection was still active
         * - 30 days: 30 days before the current date
         * - 24 hours: 24 hours before the current date
         *
         * And also we are testing several scenarios:
         * - when duration is distributed across multiple days
         * - when duration is distributed across multiple hours
         */
        const cases: DurationTrackerTestCase[] = [
            // case 1
            {
                tracker: {
                    startedTimestamp: dailyBorderDateTimestamp - 2000,
                    lastUpdatedTimestamp: dailyBorderDateTimestamp - 1000,
                },
                expected: {
                    hourly: {},
                    daily: {},
                    total: getDuration(1000),
                },
            },
            // case 1 - edge case when lastUpdated is equal to 30 days
            {
                tracker: {
                    startedTimestamp: dailyBorderDateTimestamp - 1000,
                    lastUpdatedTimestamp: dailyBorderDateTimestamp,
                },
                expected: {
                    hourly: {},
                    daily: {},
                    total: getDuration(1000),
                },
            },
            // case 2 - only one day
            {
                tracker: {
                    startedTimestamp: dailyBorderDateTimestamp + 1000,
                    lastUpdatedTimestamp: dailyBorderDateTimestamp + 2000,
                },
                expected: {
                    hourly: {},
                    daily: {
                        '2025-09-01': getDuration(1000),
                    },
                    total: getDuration(0),
                },
            },
            // case 2 - multiple days
            {
                tracker: {
                    startedTimestamp: dailyBorderDateTimestamp + 1000,
                    lastUpdatedTimestamp: dailyBorderDateTimestamp + 2 * ONE_DAY_MS + 2000,
                },
                expected: {
                    hourly: {},
                    daily: {
                        // first day used 1000ms less
                        '2025-09-01': getDuration(ONE_DAY_MS - 1000),
                        // full day
                        '2025-09-02': getDuration(ONE_DAY_MS),
                        // last day used 2000ms
                        '2025-09-03': getDuration(2000),
                    },
                    total: getDuration(0),
                },
            },
            // case 2 - edge case when started is equal to 30 days and lastUpdated is equal to 24 hours
            {
                tracker: {
                    startedTimestamp: dailyBorderDateTimestamp,
                    lastUpdatedTimestamp: hourlyBorderDateTimestamp,
                },
                expected: {
                    hourly: {},
                    daily: {
                        // all days used full day
                        ...spamAllDays(),
                        // last day used up to 10:00
                        '2025-09-30': getDuration(10 * ONE_HOUR_MS),
                    },
                    total: getDuration(0),
                },
            },
            // case 3 - only one hour
            {
                tracker: {
                    startedTimestamp: hourlyBorderDateTimestamp + 1000,
                    lastUpdatedTimestamp: hourlyBorderDateTimestamp + 2000,
                },
                expected: {
                    hourly: {
                        '2025-09-30-10': getDuration(1000),
                    },
                    daily: {},
                    total: getDuration(0),
                },
            },
            // case 3 - multiple hours
            {
                tracker: {
                    startedTimestamp: hourlyBorderDateTimestamp + 1000,
                    lastUpdatedTimestamp: hourlyBorderDateTimestamp + 2 * ONE_HOUR_MS + 2000,
                },
                expected: {
                    hourly: {
                        // first hour used 1000ms less
                        '2025-09-30-10': getDuration(ONE_HOUR_MS - 1000),
                        // full hour
                        '2025-09-30-11': getDuration(ONE_HOUR_MS),
                        // last hour used 2000ms
                        '2025-09-30-12': getDuration(2000),
                    },
                    daily: {},
                    total: getDuration(0),
                },
            },
            // case 3 - edge case when started is equal to 24 hours
            {
                tracker: {
                    startedTimestamp: hourlyBorderDateTimestamp,
                    lastUpdatedTimestamp: systemDate.getTime(),
                },
                expected: {
                    hourly: {
                        // all hours used full hour
                        ...spamAllHours(),
                        // last hour used up to current time
                        '2025-10-01-10': getDuration(systemDate.getTime() - new Date('2025-10-01T10:00:00Z').getTime()),
                    },
                    daily: {},
                    total: getDuration(0),
                },
            },
            // case 4
            {
                tracker: {
                    startedTimestamp: dailyBorderDateTimestamp - 2000,
                    lastUpdatedTimestamp: dailyBorderDateTimestamp + 2000,
                },
                expected: {
                    hourly: {},
                    daily: {
                        '2025-09-01': getDuration(2000),
                    },
                    total: getDuration(2000),
                },
            },
            // case 4 - edge case when lastUpdated is equal to 24 hours
            {
                tracker: {
                    startedTimestamp: dailyBorderDateTimestamp - 2000,
                    lastUpdatedTimestamp: hourlyBorderDateTimestamp,
                },
                expected: {
                    hourly: {},
                    daily: {
                        ...spamAllDays(29),
                        // last day used up to 10:00
                        '2025-09-30': getDuration(10 * ONE_HOUR_MS),
                    },
                    total: getDuration(2000),
                },
            },
            // case 5
            {
                tracker: {
                    startedTimestamp: hourlyBorderDateTimestamp - 2000,
                    lastUpdatedTimestamp: hourlyBorderDateTimestamp + 2000,
                },
                expected: {
                    hourly: {
                        '2025-09-30-10': getDuration(2000),
                    },
                    daily: {
                        '2025-09-30': getDuration(2000),
                    },
                    total: getDuration(0),
                },
            },
            // case 5 - edge case when started is equal to 30 days
            {
                tracker: {
                    startedTimestamp: dailyBorderDateTimestamp,
                    lastUpdatedTimestamp: hourlyBorderDateTimestamp + 2000,
                },
                expected: {
                    hourly: {
                        '2025-09-30-10': getDuration(2000),
                    },
                    daily: {
                        ...spamAllDays(29),
                        // last day used up to 10:00
                        '2025-09-30': getDuration(10 * ONE_HOUR_MS),
                    },
                    total: getDuration(0),
                },
            },
            // case 6
            {
                tracker: {
                    startedTimestamp: dailyBorderDateTimestamp - 2000,
                    lastUpdatedTimestamp: hourlyBorderDateTimestamp + 2000,
                },
                expected: {
                    hourly: {
                        '2025-09-30-10': getDuration(2000),
                    },
                    daily: {
                        ...spamAllDays(29),
                        // last day used up to 10:00
                        '2025-09-30': getDuration(10 * ONE_HOUR_MS),
                    },
                    total: getDuration(2000),
                },
            },
        ];

        it.each(cases)('should correctly resolve the duration', async ({ tracker, expected }) => {
            const accountId = 'test@adguard.com';
            const locationId = 'locationId';

            const accountsStorage: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: {
                        hourly: {},
                        daily: {},
                        total: getDuration(0),
                        durationTracker: tracker,
                    },
                },
            };
            const startedTimes: StatisticsStartedTimes = {
                [accountId]: 1,
            };

            await mockStorageAndInit(accountsStorage, startedTimes);

            const result: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: expected,
                },
            };

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(storageKey, result);
        });
    });

    describe('Period switch', () => {
        it('should move from hourly to daily properly', async () => {
            const accountId1 = 'test1@adguard.com';
            const accountId2 = 'test2@adguard.com';
            const locationId1 = 'locationId1';
            const locationId2 = 'locationId2';

            const accountsStorage: StatisticsAccountsStorage = {
                [accountId1]: {
                    [locationId1]: {
                        hourly: {
                            // should be moved to daily (24 hours passed)
                            '2025-09-29-01': getData(3),
                            // should be moved to daily (24 hours passed - close time)
                            '2025-09-30-09': getData(2),
                            // edge case: should not be moved to daily (24 hours passed, but it's border time)
                            '2025-09-30-10': getData(3),
                            // should not be moved to daily (24 hours not passed)
                            '2025-09-30-11': getData(3, 2, 1),
                            // should accumulate same day hourly
                            '2025-09-28-10': getData(1, 2, 3),
                            '2025-09-28-23': getData(3, 2, 1),
                        },
                        daily: {},
                        total: getData(0),
                    },
                    // should check different locations
                    [locationId2]: {
                        hourly: {
                            // should be moved to daily (24 hours passed)
                            '2025-09-15-23': getData(1),
                        },
                        daily: {},
                        total: getData(0),
                    },
                },
                // should check different accounts
                [accountId2]: {
                    [locationId1]: {
                        hourly: {
                            // should be moved to daily (24 hours passed)
                            '2025-09-30-09': getData(1, 2, 3),
                        },
                        daily: {},
                        total: getData(0),
                    },
                },
            };

            const startedTimes: StatisticsStartedTimes = {
                [accountId1]: 1,
                [accountId2]: 2,
            };

            await mockStorageAndInit(accountsStorage, startedTimes);

            const result: StatisticsAccountsStorage = {
                [accountId1]: {
                    [locationId1]: {
                        hourly: {
                            '2025-09-30-10': getData(3),
                            '2025-09-30-11': getData(3, 2, 1),
                        },
                        daily: {
                            '2025-09-29': getData(3),
                            '2025-09-30': getData(2),
                            '2025-09-28': getData(4),
                        },
                        total: getData(0),
                    },
                    [locationId2]: {
                        hourly: {},
                        daily: {
                            '2025-09-15': getData(1),
                        },
                        total: getData(0),
                    },
                },
                [accountId2]: {
                    [locationId1]: {
                        hourly: {},
                        daily: {
                            '2025-09-30': getData(1, 2, 3),
                        },
                        total: getData(0),
                    },
                },
            };

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(storageKey, result);
        });

        it('should store past 24 hours only', async () => {
            const accountId = 'test@adguard.com';
            const locationId = 'locationId1';

            const accountsStorage: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: {
                        hourly: {
                            '2025-10-01-10': getData(1),
                            '2025-10-01-09': getData(1),
                            '2025-10-01-08': getData(1),
                            '2025-10-01-07': getData(1),
                            '2025-10-01-06': getData(1),
                            '2025-10-01-05': getData(1),
                            '2025-10-01-04': getData(1),
                            '2025-10-01-03': getData(1),
                            '2025-10-01-02': getData(1),
                            '2025-10-01-01': getData(1),
                            '2025-10-01-00': getData(1),
                            '2025-09-30-23': getData(1),
                            '2025-09-30-22': getData(1),
                            '2025-09-30-21': getData(1),
                            '2025-09-30-20': getData(1),
                            '2025-09-30-19': getData(1),
                            '2025-09-30-18': getData(1),
                            '2025-09-30-17': getData(1),
                            '2025-09-30-16': getData(1),
                            '2025-09-30-15': getData(1),
                            '2025-09-30-14': getData(1),
                            '2025-09-30-13': getData(1),
                            '2025-09-30-12': getData(1),
                            '2025-09-30-11': getData(1),
                            '2025-09-30-10': getData(1),
                            '2025-09-30-09': getData(1),
                            '2025-09-30-08': getData(1),
                        },
                        daily: {},
                        total: getData(0),
                    },
                },
            };

            const startedTimes: StatisticsStartedTimes = {
                [accountId]: 1,
            };

            await mockStorageAndInit(accountsStorage, startedTimes);

            const result: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: {
                        hourly: {
                            '2025-10-01-10': getData(1),
                            '2025-10-01-09': getData(1),
                            '2025-10-01-08': getData(1),
                            '2025-10-01-07': getData(1),
                            '2025-10-01-06': getData(1),
                            '2025-10-01-05': getData(1),
                            '2025-10-01-04': getData(1),
                            '2025-10-01-03': getData(1),
                            '2025-10-01-02': getData(1),
                            '2025-10-01-01': getData(1),
                            '2025-10-01-00': getData(1),
                            '2025-09-30-23': getData(1),
                            '2025-09-30-22': getData(1),
                            '2025-09-30-21': getData(1),
                            '2025-09-30-20': getData(1),
                            '2025-09-30-19': getData(1),
                            '2025-09-30-18': getData(1),
                            '2025-09-30-17': getData(1),
                            '2025-09-30-16': getData(1),
                            '2025-09-30-15': getData(1),
                            '2025-09-30-14': getData(1),
                            '2025-09-30-13': getData(1),
                            '2025-09-30-12': getData(1),
                            '2025-09-30-11': getData(1),
                            '2025-09-30-10': getData(1),
                        },
                        daily: {
                            '2025-09-30': getData(2),
                        },
                        total: getData(0),
                    },
                },
            };

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(storageKey, result);
        });

        it('should move from daily to total properly', async () => {
            const accountId1 = 'test1@adguard.com';
            const accountId2 = 'test2@adguard.com';
            const locationId1 = 'locationId1';
            const locationId2 = 'locationId2';

            const accountsStorage: StatisticsAccountsStorage = {
                [accountId1]: {
                    [locationId1]: {
                        hourly: {},
                        // should accumulate total
                        daily: {
                            // should be moved to total (30 days passed)
                            '2025-08-01': getData(3),
                            // edge case: should not be moved to total (30 days passed, but it's border time)
                            '2025-09-01': getData(2),
                            // should be moved to total (30 days passed - close date)
                            '2025-08-31': getData(2),
                            // should not be moved to total (30 days not passed)
                            '2025-09-30': getData(3, 2, 1),
                        },
                        total: getData(0),
                    },
                    // should check different locations
                    [locationId2]: {
                        hourly: {},
                        daily: {
                            // should be moved to total (30 days passed)
                            '2025-08-31': getData(1),
                        },
                        total: getData(0),
                    },
                },
                // should check different accounts
                [accountId2]: {
                    [locationId1]: {
                        hourly: {},
                        daily: {
                            // should be moved to total (30 days passed)
                            '2025-08-31': getData(1, 2, 3),
                        },
                        total: getData(0),
                    },
                },
            };

            const startedTimes: StatisticsStartedTimes = {
                [accountId1]: 1,
                [accountId2]: 2,
            };

            await mockStorageAndInit(accountsStorage, startedTimes);

            const result: StatisticsAccountsStorage = {
                [accountId1]: {
                    [locationId1]: {
                        hourly: {},
                        daily: {
                            '2025-09-01': getData(2),
                            '2025-09-30': getData(3, 2, 1),
                        },
                        total: getData(5),
                    },
                    [locationId2]: {
                        hourly: {},
                        daily: {},
                        total: getData(1),
                    },
                },
                [accountId2]: {
                    [locationId1]: {
                        hourly: {},
                        daily: {},
                        total: getData(1, 2, 3),
                    },
                },
            };

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(storageKey, result);
        });

        it('should store past 30 days only', async () => {
            const accountId = 'test@adguard.com';
            const locationId = 'locationId1';

            const accountsStorage: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: {
                        hourly: {},
                        daily: {
                            '2025-10-01': getData(1),
                            '2025-09-30': getData(1),
                            '2025-09-29': getData(1),
                            '2025-09-28': getData(1),
                            '2025-09-27': getData(1),
                            '2025-09-26': getData(1),
                            '2025-09-25': getData(1),
                            '2025-09-24': getData(1),
                            '2025-09-23': getData(1),
                            '2025-09-22': getData(1),
                            '2025-09-21': getData(1),
                            '2025-09-20': getData(1),
                            '2025-09-19': getData(1),
                            '2025-09-18': getData(1),
                            '2025-09-17': getData(1),
                            '2025-09-16': getData(1),
                            '2025-09-15': getData(1),
                            '2025-09-14': getData(1),
                            '2025-09-13': getData(1),
                            '2025-09-12': getData(1),
                            '2025-09-11': getData(1),
                            '2025-09-10': getData(1),
                            '2025-09-09': getData(1),
                            '2025-09-08': getData(1),
                            '2025-09-07': getData(1),
                            '2025-09-06': getData(1),
                            '2025-09-05': getData(1),
                            '2025-09-04': getData(1),
                            '2025-09-03': getData(1),
                            '2025-09-02': getData(1),
                            '2025-09-01': getData(1),
                            '2025-08-31': getData(1),
                            '2025-08-30': getData(1),
                            '2025-08-29': getData(1),
                        },
                        total: getData(0),
                    },
                },
            };

            const startedTimes: StatisticsStartedTimes = {
                [accountId]: 1,
            };

            await mockStorageAndInit(accountsStorage, startedTimes);

            const result: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: {
                        hourly: {},
                        daily: {
                            '2025-10-01': getData(1),
                            '2025-09-30': getData(1),
                            '2025-09-29': getData(1),
                            '2025-09-28': getData(1),
                            '2025-09-27': getData(1),
                            '2025-09-26': getData(1),
                            '2025-09-25': getData(1),
                            '2025-09-24': getData(1),
                            '2025-09-23': getData(1),
                            '2025-09-22': getData(1),
                            '2025-09-21': getData(1),
                            '2025-09-20': getData(1),
                            '2025-09-19': getData(1),
                            '2025-09-18': getData(1),
                            '2025-09-17': getData(1),
                            '2025-09-16': getData(1),
                            '2025-09-15': getData(1),
                            '2025-09-14': getData(1),
                            '2025-09-13': getData(1),
                            '2025-09-12': getData(1),
                            '2025-09-11': getData(1),
                            '2025-09-10': getData(1),
                            '2025-09-09': getData(1),
                            '2025-09-08': getData(1),
                            '2025-09-07': getData(1),
                            '2025-09-06': getData(1),
                            '2025-09-05': getData(1),
                            '2025-09-04': getData(1),
                            '2025-09-03': getData(1),
                            '2025-09-02': getData(1),
                            '2025-09-01': getData(1),
                        },
                        total: getData(3),
                    },
                },
            };

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(storageKey, result);
        });
    });

    describe('Adding statistics', () => {
        it('should add traffic statistics properly', async () => {
            const accountId = 'test@adguard.com';
            const locationId = 'locationId10';
            const downloadedBytes = 1111;
            const uploadedBytes = 2222;

            await mockStorageAndInit();

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);

            await statisticsStorage.addTraffic({
                accountId,
                locationId,
                downloadedBytes,
                uploadedBytes,
            });

            const result: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: {
                        hourly: {
                            '2025-10-01-10': getData(downloadedBytes, uploadedBytes, 0),
                        },
                        daily: {},
                        total: getData(0),
                    },
                },
            };

            // for addTraffic
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenNthCalledWith(2, storageKey, result);
        });

        it('should add duration tracker properly', async () => {
            const accountId = 'test@adguard.com';
            const locationId = 'locationId11';

            await mockStorageAndInit();

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);

            await statisticsStorage.startDuration({
                accountId,
                locationId,
            });

            const result1: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: {
                        hourly: {},
                        daily: {},
                        total: getData(0),
                        durationTracker: {
                            startedTimestamp: systemDate.getTime(),
                            lastUpdatedTimestamp: systemDate.getTime(),
                        },
                    },
                },
            };

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenNthCalledWith(2, storageKey, result1);

            jest.advanceTimersByTime(1000);
            await statisticsStorage.updateDuration({
                accountId,
                locationId,
            });

            const result2: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: {
                        hourly: {},
                        daily: {},
                        total: getData(0),
                        durationTracker: {
                            startedTimestamp: systemDate.getTime(),
                            lastUpdatedTimestamp: systemDate.getTime() + 1000,
                        },
                    },
                },
            };

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(3);
            expect(storageMock.set).toHaveBeenNthCalledWith(3, storageKey, result2);

            jest.advanceTimersByTime(1000);
            await statisticsStorage.endDuration({
                accountId,
                locationId,
            });

            const result3: StatisticsAccountsStorage = {
                [accountId]: {
                    [locationId]: {
                        hourly: {
                            '2025-10-01-10': getDuration(2000),
                        },
                        daily: {},
                        total: getData(0),
                    },
                },
            };

            // for endDuration
            expect(storageMock.set).toHaveBeenCalledTimes(4);
            expect(storageMock.set).toHaveBeenNthCalledWith(4, storageKey, result3);
        });

        it('should add account properly', async () => {
            const accountId = 'test-account@adguard.com';

            await mockStorageAndInit();

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);

            await statisticsStorage.addAccount(accountId);

            const accountsStorageResult: StatisticsAccountsStorage = {
                [accountId]: {},
            };
            const startedTimesResult: StatisticsStartedTimes = {
                [accountId]: expect.any(Number),
            };

            expect(storageMock.set).toHaveBeenCalledTimes(3);
            expect(storageMock.set).toHaveBeenCalledWith(storageKey, accountsStorageResult);
            expect(storageMock.set).toHaveBeenCalledWith(startedTimesKey, startedTimesResult);
        });
    });

    it('should convert date to key and key to date properly', () => {
        // date to key - hourly
        expect(StatisticsStorage.dateToKey(true)).toBe('2025-10-01-10');
        expect(StatisticsStorage.dateToKey(true, new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31-23');
        expect(StatisticsStorage.dateToKey(true, new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01-00');

        // date to key - daily
        expect(StatisticsStorage.dateToKey(false)).toBe('2025-10-01');
        expect(StatisticsStorage.dateToKey(false, new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31');
        expect(StatisticsStorage.dateToKey(false, new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01');

        // key to date - hourly
        expect(StatisticsStorage.keyToDate('2025-10-01-10')).toEqual(new Date('2025-10-01T10:00:00Z'));
        expect(StatisticsStorage.keyToDate('2025-12-31-23')).toEqual(new Date('2025-12-31T23:00:00Z'));
        expect(StatisticsStorage.keyToDate('2025-01-01-00')).toEqual(new Date('2025-01-01T00:00:00Z'));

        // key to date - daily
        expect(StatisticsStorage.keyToDate('2025-10-01')).toEqual(new Date('2025-10-01T00:00:00Z'));
        expect(StatisticsStorage.keyToDate('2025-12-31')).toEqual(new Date('2025-12-31T00:00:00Z'));
        expect(StatisticsStorage.keyToDate('2025-01-01')).toEqual(new Date('2025-01-01T00:00:00Z'));

        // key to date - invalid
        expect(StatisticsStorage.keyToDate('invalid')).toBe(null);
        expect(StatisticsStorage.keyToDate('2025-10-01-10-00')).toBe(null);
        expect(StatisticsStorage.keyToDate('2025-10-test')).toBe(null);
        expect(StatisticsStorage.keyToDate('2025-test-01')).toBe(null);
        expect(StatisticsStorage.keyToDate('test-01-01')).toBe(null);
    });
});
