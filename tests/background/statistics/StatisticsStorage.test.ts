import { StatisticsStorage } from '../../../src/background/statistics/StatisticsStorage';
import {
    type StatisticsData,
    type StatisticsDurationTracker,
    type StatisticsLocationData,
    type StatisticsDailyStorage,
    type StatisticsHourlyStorage,
    type Statistics,
    type StatisticsLocationsStorage,
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

    /**
     * Returns statistics with provided locations.
     *
     * @param locations Locations to include.
     *
     * @returns Statistics.
     */
    const getStatistics = (locations: StatisticsLocationsStorage = {}): Statistics => ({
        locations,
        startedTimestamp: 0,
    });

    describe('Initialization', () => {
        it('should initialize properly', async () => {
            storageMock.get.mockResolvedValueOnce(undefined);

            await statisticsStorage.init();

            expect(storageMock.get).toHaveBeenCalledTimes(1);
            expect(storageMock.get).toHaveBeenCalledWith(expect.any(String));
        });

        it('should restore statistics from local storage', async () => {
            const statistics = getStatistics();

            storageMock.get.mockResolvedValueOnce(statistics);

            await statisticsStorage.init();

            expect(storageMock.get).toHaveBeenCalledTimes(1);
            expect(storageMock.get).toHaveBeenCalledWith(expect.any(String));

            // @ts-expect-error - accessing private property
            expect(statisticsStorage.statistics).toEqual(statistics);
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
            const locationId = 'locationId';

            storageMock.get.mockResolvedValueOnce(getStatistics({
                [locationId]: {
                    hourly: {},
                    daily: {},
                    total: getDuration(0),
                    durationTracker: tracker,
                },
            }));

            await statisticsStorage.init();

            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), getStatistics({
                [locationId]: expected,
            }));
        });
    });

    describe('Period switch', () => {
        /**
         * Test case for period switch.
         */
        type PeriodSwitchTestCase = {
            /**
             * Locations storage to test.
             */
            storage: StatisticsLocationsStorage;

            /**
             * Expected locations storage after processing the storage.
             */
            expected: StatisticsLocationsStorage;
        };

        const locationId1 = 'locationId1';
        const locationId2 = 'locationId2';

        const cases: PeriodSwitchTestCase[] = [
            // case 1 - should move from hourly to daily properly
            {
                storage: {
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
                expected: {
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
            },
            // case 2 - should store past 24 hours only
            {
                storage: {
                    [locationId1]: {
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
                            '2025-09-30-09': getData(1), // <-- should be moved to daily
                            '2025-09-30-08': getData(1), // <-- should be moved to daily
                        },
                        daily: {},
                        total: getData(0),
                    },
                },
                expected: {
                    [locationId1]: {
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
            },
            // case 3 - should move from daily to total properly
            {
                storage: {
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
                expected: {
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
            },
            // case 4 - should store past 30 days only
            {
                storage: {
                    [locationId1]: {
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
                            '2025-08-31': getData(1), // <-- should be moved to total
                            '2025-08-30': getData(1), // <-- should be moved to total
                            '2025-08-29': getData(1), // <-- should be moved to total
                        },
                        total: getData(0),
                    },
                },
                expected: {
                    [locationId1]: {
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
            },
        ];

        it.each(cases)('should switch period properly', async ({ storage, expected }) => {
            storageMock.get.mockResolvedValueOnce(getStatistics(storage));

            await statisticsStorage.init();

            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), getStatistics(expected));
        });
    });

    describe('Working with statistics', () => {
        it('should add traffic statistics properly', async () => {
            const locationId = 'locationId10';
            const downloadedBytes = 1111;
            const uploadedBytes = 2222;

            storageMock.get.mockResolvedValueOnce(getStatistics());

            await statisticsStorage.init();

            await statisticsStorage.addTraffic(locationId, {
                downloadedBytes,
                uploadedBytes,
            });

            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), getStatistics({
                [locationId]: {
                    hourly: {
                        '2025-10-01-10': getData(downloadedBytes, uploadedBytes, 0),
                    },
                    daily: {},
                    total: getData(0),
                },
            }));
        });

        it('should add duration tracker properly', async () => {
            const locationId = 'locationId11';

            storageMock.get.mockResolvedValueOnce(getStatistics());

            await statisticsStorage.init();

            await statisticsStorage.startDuration(locationId);

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenNthCalledWith(1, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: {},
                    daily: {},
                    total: getData(0),
                    durationTracker: {
                        startedTimestamp: systemDate.getTime(),
                        lastUpdatedTimestamp: systemDate.getTime(),
                    },
                },
            }));

            jest.advanceTimersByTime(1000);
            await statisticsStorage.updateDuration(locationId);

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenNthCalledWith(2, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: {},
                    daily: {},
                    total: getData(0),
                    durationTracker: {
                        startedTimestamp: systemDate.getTime(),
                        lastUpdatedTimestamp: systemDate.getTime() + 1000,
                    },
                },
            }));

            jest.advanceTimersByTime(1000);
            await statisticsStorage.endDuration(locationId);

            // for endDuration
            expect(storageMock.set).toHaveBeenCalledTimes(3);
            expect(storageMock.set).toHaveBeenNthCalledWith(3, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: {
                        '2025-10-01-10': getDuration(2000),
                    },
                    daily: {},
                    total: getData(0),
                },
            }));
        });

        it('should return statistics properly', async () => {
            const statistics = getStatistics({
                locationId: {
                    hourly: {
                        '2025-10-01-10': getData(1),
                    },
                    daily: {
                        '2025-10-01': getData(2),
                    },
                    total: getData(3),
                },
            });

            storageMock.get.mockResolvedValueOnce(statistics);

            await statisticsStorage.init();

            const result = await statisticsStorage.getStatistics();

            expect(result).toEqual(statistics);
        });

        it('should return updated account storage after time', async () => {
            storageMock.get.mockResolvedValueOnce(getStatistics({
                locationId: {
                    hourly: {
                        '2025-10-01-10': getData(1),
                        '2025-09-30-10': getData(1),
                    },
                    daily: {
                        '2025-10-01': getData(2),
                        '2025-09-01': getData(2),
                    },
                    total: getData(3),
                },
            }));

            await statisticsStorage.init();

            // advance by 1 hour
            jest.advanceTimersByTime(ONE_HOUR_MS);

            const result1 = await statisticsStorage.getStatistics();

            expect(result1).toEqual(getStatistics({
                locationId: {
                    hourly: {
                        '2025-10-01-10': getData(1),
                    },
                    daily: {
                        '2025-10-01': getData(2),
                        '2025-09-30': getData(1),
                        '2025-09-01': getData(2),
                    },
                    total: getData(3),
                },
            }));

            // advance by 1 day
            jest.advanceTimersByTime(ONE_DAY_MS);

            const result2 = await statisticsStorage.getStatistics();

            expect(result2).toEqual(getStatistics({
                locationId: {
                    hourly: {},
                    daily: {
                        '2025-09-30': getData(1),
                        '2025-10-01': getData(3),
                    },
                    total: getData(5),
                },
            }));
        });

        it('should clear statistics for the given account', async () => {
            storageMock.get.mockResolvedValueOnce(getStatistics({
                locationId: {
                    hourly: {
                        '2025-10-01-10': getData(1),
                    },
                    daily: {
                        '2025-10-01': getData(2),
                    },
                    total: getData(3),
                },
            }));

            await statisticsStorage.init();

            await statisticsStorage.clearStatistics();

            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), {
                locations: {},
                startedTimestamp: systemDate.getTime(),
            });
        });
    });
});
