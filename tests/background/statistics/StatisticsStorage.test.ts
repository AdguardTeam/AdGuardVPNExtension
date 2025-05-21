import { StatisticsStorage } from '../../../src/background/statistics/StatisticsStorage';
import {
    type StatisticsData,
    type StatisticsDurationTracker,
    type StatisticsLocationStorage,
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

    beforeEach(() => {
        statisticsStorage = new StatisticsStorage({
            storage: storageMock,
        });
        jest.useFakeTimers('modern').setSystemTime(systemDate);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe('Initialization', () => {
        it('should initialize properly', async () => {
            storageMock.get.mockResolvedValueOnce(undefined);

            await statisticsStorage.init();

            expect(storageMock.get).toHaveBeenCalledTimes(1);
            expect(storageMock.get).toHaveBeenCalledWith(expect.any(String));
            // 2 times - once for init and once for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), {});
        });

        it('should restore statistics from local storage', async () => {
            const storage = {
                'account@adguard.com': {},
            };

            storageMock.get.mockResolvedValueOnce(storage);

            await statisticsStorage.init();

            expect(storageMock.get).toHaveBeenCalledTimes(1);
            expect(storageMock.get).toHaveBeenCalledWith(expect.any(String));
            // @ts-expect-error - accessing private property
            expect(statisticsStorage.statistics).toEqual(storage);
        });
    });

    describe('Duration tracker', () => {
        // @ts-expect-error - accessing private method
        const dailyBorderDateTimestamp = StatisticsStorage.getDailyBorderTimestamp(systemDate.getTime());
        // @ts-expect-error - accessing private method
        const hourlyBorderDateTimestamp = StatisticsStorage.getHourlyBorderTimestamp(systemDate.getTime());

        type DurationTrackerTestCase = {
            tracker: StatisticsDurationTracker;
            expected: StatisticsLocationStorage;
        };

        const getDuration = (duration: number) => ({
            downloaded: 0,
            uploaded: 0,
            duration,
        });

        const spamAllDays = (daysCount = 30) => {
            const days: Record<string, StatisticsData> = {};
            for (let i = 0; i < daysCount; i += 1) {
                const date = new Date(dailyBorderDateTimestamp + i * ONE_DAY_MS);
                const dateKey = date.toISOString().split('T')[0];
                days[dateKey] = getDuration(ONE_DAY_MS);
            }
            return days;
        };

        const spamAllHours = (hoursCount = 24) => {
            const hours: Record<string, StatisticsData> = {};
            for (let i = 0; i < hoursCount; i += 1) {
                const date = new Date(hourlyBorderDateTimestamp + i * ONE_HOUR_MS);
                const dateKey = date.toISOString().split('T')[0];
                const hourKey = String(date.getUTCHours()).padStart(2, '0');
                hours[`${dateKey}-${hourKey}`] = getDuration(ONE_HOUR_MS);
            }
            return hours;
        };

        /**
         * There are 6 cases to test:
         * 1. started < lastUpdated < 30 days < 24 hours
         *    - lastUpdated - started should go to total duration
         * 2. 30 days < started < lastUpdated < 24 hours
         *    - lastUpdated - started should spread across daily
         * 3. 30 days < 24 hours < started < lastUpdated
         *    - lastUpdated - started should spread across hourly
         * 4. started < 30 days < lastUpdated < 24 hours
         *    - 30 days - started should go to total duration
         *    - lastUpdated - 30 days should spread across daily
         * 5. 30 days < started < 24 hours < lastUpdated
         *    - 24 hours - started should spread across daily
         *    - lastUpdated - 24 hours should spread across hourly
         * 6. started < 30 days < 24 hours < lastUpdated
         *    - 30 days - started should go to total duration
         *    - 24 hours - 30 days should spread across daily
         *    - lastUpdated - 24 hours should spread across hourly
         *
         * Where:
         * - started: the time when connection was started
         * - lastUpdated: the last time when connection was still active
         * - 30 days: 30 days before the current date
         * - 24 hours: 24 hours before the current date
         *
         * And also we are testing several scenarios:
         * - when duration is spread across multiple days
         * - when duration is spread across multiple hours
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
                        // last day used 2000ms more
                        '2025-09-03': getDuration(3000),
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

            storageMock.get.mockResolvedValueOnce({
                [accountId]: {
                    [locationId]: {
                        hourly: {},
                        daily: {},
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                        durationTracker: tracker,
                    },
                },
            });

            await statisticsStorage.init();

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), {
                [accountId]: {
                    [locationId]: expected,
                },
            });
        });
    });

    describe('Period switch', () => {
        it('should move from hourly to daily or total properly', async () => {
            storageMock.get.mockResolvedValueOnce({
                'test1@adguard.com': {
                    locationId1: {
                        hourly: {
                            // should be moved to daily (24 hours passed)
                            '2025-09-29-01': {
                                downloaded: 3,
                                uploaded: 3,
                                duration: 3,
                            },
                            // should be moved to daily (24 hours passed - close time)
                            '2025-09-30-10': {
                                downloaded: 2,
                                uploaded: 2,
                                duration: 2,
                            },
                            // should not be moved to daily (24 hours not passed)
                            '2025-09-30-11': {
                                downloaded: 3,
                                uploaded: 2,
                                duration: 1,
                            },
                            // should accumulate same day hourly
                            '2025-09-28-10': {
                                downloaded: 1,
                                uploaded: 2,
                                duration: 3,
                            },
                            '2025-09-28-23': {
                                downloaded: 3,
                                uploaded: 2,
                                duration: 1,
                            },
                            // should be moved to total and accumulated (30 days passed)
                            '2025-09-01-10': {
                                downloaded: 4,
                                uploaded: 4,
                                duration: 4,
                            },
                            '2025-08-28-23': {
                                downloaded: 5,
                                uploaded: 5,
                                duration: 5,
                            },
                        },
                        daily: {},
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                    // should check different locations
                    locationId2: {
                        hourly: {
                            // should be moved to daily (24 hours passed)
                            '2025-09-15-23': {
                                downloaded: 1,
                                uploaded: 1,
                                duration: 1,
                            },
                        },
                        daily: {},
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                },
                // should check different accounts
                'test2@adguard.com': {
                    locationId1: {
                        hourly: {
                            // should be moved to daily (24 hours passed)
                            '2025-09-30-09': {
                                downloaded: 1,
                                uploaded: 2,
                                duration: 3,
                            },
                        },
                        daily: {},
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                },
            });

            await statisticsStorage.init();

            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), {
                'test1@adguard.com': {
                    locationId1: {
                        hourly: {
                            '2025-09-30-11': {
                                downloaded: 3,
                                uploaded: 2,
                                duration: 1,
                            },
                        },
                        daily: {
                            '2025-09-29': {
                                downloaded: 3,
                                uploaded: 3,
                                duration: 3,
                            },
                            '2025-09-30': {
                                downloaded: 2,
                                uploaded: 2,
                                duration: 2,
                            },
                            '2025-09-28': {
                                downloaded: 4,
                                uploaded: 4,
                                duration: 4,
                            },
                        },
                        total: {
                            downloaded: 9,
                            uploaded: 9,
                            duration: 9,
                        },
                    },
                    locationId2: {
                        hourly: {},
                        daily: {
                            '2025-09-15': {
                                downloaded: 1,
                                uploaded: 1,
                                duration: 1,
                            },
                        },
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                },
                'test2@adguard.com': {
                    locationId1: {
                        hourly: {},
                        daily: {
                            '2025-09-30': {
                                downloaded: 1,
                                uploaded: 2,
                                duration: 3,
                            },
                        },
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                },
            });
        });

        it('should move from daily to total properly', async () => {
            storageMock.get.mockResolvedValueOnce({
                'test1@adguard.com': {
                    locationId1: {
                        hourly: {},
                        // should accumulate total
                        daily: {
                            // should be moved to total (30 days passed)
                            '2025-08-01': {
                                downloaded: 3,
                                uploaded: 3,
                                duration: 3,
                            },
                            // should be moved to total (30 days passed - close date)
                            '2025-09-01': {
                                downloaded: 2,
                                uploaded: 2,
                                duration: 2,
                            },
                            // should not be moved to total (30 days not passed)
                            '2025-09-30': {
                                downloaded: 3,
                                uploaded: 2,
                                duration: 1,
                            },
                        },
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                    // should check different locations
                    locationId2: {
                        hourly: {},
                        daily: {
                            // should be moved to total (30 days passed)
                            '2025-09-01': {
                                downloaded: 1,
                                uploaded: 1,
                                duration: 1,
                            },
                        },
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                },
                // should check different accounts
                'test2@adguard.com': {
                    locationId1: {
                        hourly: {},
                        daily: {
                            // should be moved to total (30 days passed)
                            '2025-09-01': {
                                downloaded: 1,
                                uploaded: 2,
                                duration: 3,
                            },
                        },
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                },
            });

            await statisticsStorage.init();

            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), {
                'test1@adguard.com': {
                    locationId1: {
                        hourly: {},
                        daily: {
                            '2025-09-30': {
                                downloaded: 3,
                                uploaded: 2,
                                duration: 1,
                            },
                        },
                        total: {
                            downloaded: 5,
                            uploaded: 5,
                            duration: 5,
                        },
                    },
                    locationId2: {
                        hourly: {},
                        daily: {},
                        total: {
                            downloaded: 1,
                            uploaded: 1,
                            duration: 1,
                        },
                    },
                },
                'test2@adguard.com': {
                    locationId1: {
                        hourly: {},
                        daily: {},
                        total: {
                            downloaded: 1,
                            uploaded: 2,
                            duration: 3,
                        },
                    },
                },
            });
        });
    });

    describe('Adding statistics', () => {
        it('should add traffic statistics properly', async () => {
            storageMock.get.mockResolvedValueOnce({});

            await statisticsStorage.init();

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);

            await statisticsStorage.addTraffic({
                accountId: 'test@adguard.com',
                locationId: 'locationId10',
                downloaded: 1111,
                uploaded: 2222,
            });

            // for addTraffic
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenNthCalledWith(2, expect.any(String), {
                'test@adguard.com': {
                    locationId10: {
                        hourly: {
                            '2025-10-01-10': {
                                downloaded: 1111,
                                uploaded: 2222,
                                duration: 0,
                            },
                        },
                        daily: {},
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                },
            });
        });

        it('should add duration tracker properly', async () => {
            const accountId = 'test@adguard.com';
            const locationId = 'locationId11';
            const data = { accountId, locationId };

            storageMock.get.mockResolvedValueOnce({});

            await statisticsStorage.init();

            // for update stale statistics
            expect(storageMock.set).toHaveBeenCalledTimes(1);

            await statisticsStorage.startDuration(data);

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenNthCalledWith(2, expect.any(String), {
                [accountId]: {
                    [locationId]: {
                        hourly: {},
                        daily: {},
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                        durationTracker: {
                            startedTimestamp: systemDate.getTime(),
                            lastUpdatedTimestamp: systemDate.getTime(),
                        },
                    },
                },
            });

            jest.advanceTimersByTime(1000);
            await statisticsStorage.updateDuration(data);

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(3);
            expect(storageMock.set).toHaveBeenNthCalledWith(3, expect.any(String), {
                [accountId]: {
                    [locationId]: {
                        hourly: {},
                        daily: {},
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                        durationTracker: {
                            startedTimestamp: systemDate.getTime(),
                            lastUpdatedTimestamp: systemDate.getTime() + 1000,
                        },
                    },
                },
            });

            jest.advanceTimersByTime(1000);
            await statisticsStorage.endDuration(data);

            // for endDuration
            expect(storageMock.set).toHaveBeenCalledTimes(4);
            expect(storageMock.set).toHaveBeenNthCalledWith(4, expect.any(String), {
                [accountId]: {
                    [locationId]: {
                        hourly: {
                            '2025-10-01-10': {
                                downloaded: 0,
                                uploaded: 0,
                                duration: 2000,
                            },
                        },
                        daily: {},
                        total: {
                            downloaded: 0,
                            uploaded: 0,
                            duration: 0,
                        },
                    },
                },
            });
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
