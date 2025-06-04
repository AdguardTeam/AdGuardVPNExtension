import { StatisticsStorage } from '../../../src/background/statistics/StatisticsStorage';
import {
    type Statistics,
    type StatisticsDataTuple,
    type StatisticsSessionTuple,
    type StatisticsLocationsStorage,
} from '../../../src/background/statistics/statisticsTypes';

jest.mock('lodash/throttle', () => jest.fn((fn) => fn));

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
     *
     * @returns Statistics data.
     */
    const getData = (
        downloadedBytes: number,
        uploadedBytes = downloadedBytes,
    ): StatisticsDataTuple => ([
        downloadedBytes,
        uploadedBytes,
    ]);

    /**
     * Get duration for testing.
     *
     * @param startedTimestamp Session start timestamp.
     * @param endedTimestamp Session end timestamp (Default is `started`).
     *
     * @returns Statistics session tuple.
     */
    const getSession = (
        startedTimestamp: number,
        endedTimestamp = startedTimestamp,
    ): StatisticsSessionTuple => ([
        startedTimestamp,
        endedTimestamp,
    ]);

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

    describe('Storage optimization', () => {
        /**
         * Test case for switch.
         */
        type OptimizationCase = {
            /**
             * Input data for the test case.
             */
            storage: StatisticsLocationsStorage;

            /**
             * Expected data after processing the input.
             */
            expected: StatisticsLocationsStorage;

            /**
             * If true, the data should not be saved to storage.
             */
            shouldNotSave?: boolean;
        };

        const locationId1 = 'locationId1';
        const locationId2 = 'locationId2';

        const NOW = systemDate.getTime();
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const THRESHOLD_TIMESTAMP = NOW - THIRTY_DAYS_MS;

        const cases: [string, OptimizationCase][] = [
            ['data - should move from hourly to daily properly', {
                storage: {
                    [locationId1]: {
                        hourly: [
                            // should accumulate same day hourly
                            ['2025-09-28-10', getData(1, 2)],
                            ['2025-09-28-23', getData(3, 2)],
                            // should be moved to daily (24 hours passed)
                            ['2025-09-29-01', getData(3)],
                            // should be moved to daily (24 hours passed - close time)
                            ['2025-09-30-09', getData(2)],
                            // edge case: should not be moved to daily (24 hours passed, but it's border time)
                            ['2025-09-30-10', getData(3)],
                            // should not be moved to daily (24 hours not passed)
                            ['2025-09-30-11', getData(3, 2)],
                        ],
                        daily: [],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                    // should check different locations
                    [locationId2]: {
                        hourly: [
                            // should be moved to daily (24 hours passed)
                            ['2025-09-15-23', getData(1)],
                        ],
                        daily: [],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [
                            ['2025-09-30-10', getData(3)],
                            ['2025-09-30-11', getData(3, 2)],
                        ],
                        daily: [
                            ['2025-09-28', getData(4)],
                            ['2025-09-29', getData(3)],
                            ['2025-09-30', getData(2)],
                        ],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                    [locationId2]: {
                        hourly: [],
                        daily: [
                            ['2025-09-15', getData(1)],
                        ],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                },
            }],
            ['data - should store past 24 hours only', {
                storage: {
                    [locationId1]: {
                        hourly: [
                            ['2025-09-30-08', getData(1)], // <-- should be moved to daily
                            ['2025-09-30-09', getData(1)], // <-- should be moved to daily
                            ['2025-09-30-10', getData(1)],
                            ['2025-09-30-11', getData(1)],
                            ['2025-09-30-12', getData(1)],
                            ['2025-09-30-13', getData(1)],
                            ['2025-09-30-14', getData(1)],
                            ['2025-09-30-15', getData(1)],
                            ['2025-09-30-16', getData(1)],
                            ['2025-09-30-17', getData(1)],
                            ['2025-09-30-18', getData(1)],
                            ['2025-09-30-19', getData(1)],
                            ['2025-09-30-20', getData(1)],
                            ['2025-09-30-21', getData(1)],
                            ['2025-09-30-22', getData(1)],
                            ['2025-09-30-23', getData(1)],
                            ['2025-10-01-00', getData(1)],
                            ['2025-10-01-01', getData(1)],
                            ['2025-10-01-02', getData(1)],
                            ['2025-10-01-03', getData(1)],
                            ['2025-10-01-04', getData(1)],
                            ['2025-10-01-05', getData(1)],
                            ['2025-10-01-06', getData(1)],
                            ['2025-10-01-07', getData(1)],
                            ['2025-10-01-08', getData(1)],
                            ['2025-10-01-09', getData(1)],
                            ['2025-10-01-10', getData(1)],
                        ],
                        daily: [],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [
                            ['2025-09-30-10', getData(1)],
                            ['2025-09-30-11', getData(1)],
                            ['2025-09-30-12', getData(1)],
                            ['2025-09-30-13', getData(1)],
                            ['2025-09-30-14', getData(1)],
                            ['2025-09-30-15', getData(1)],
                            ['2025-09-30-16', getData(1)],
                            ['2025-09-30-17', getData(1)],
                            ['2025-09-30-18', getData(1)],
                            ['2025-09-30-19', getData(1)],
                            ['2025-09-30-20', getData(1)],
                            ['2025-09-30-21', getData(1)],
                            ['2025-09-30-22', getData(1)],
                            ['2025-09-30-23', getData(1)],
                            ['2025-10-01-00', getData(1)],
                            ['2025-10-01-01', getData(1)],
                            ['2025-10-01-02', getData(1)],
                            ['2025-10-01-03', getData(1)],
                            ['2025-10-01-04', getData(1)],
                            ['2025-10-01-05', getData(1)],
                            ['2025-10-01-06', getData(1)],
                            ['2025-10-01-07', getData(1)],
                            ['2025-10-01-08', getData(1)],
                            ['2025-10-01-09', getData(1)],
                            ['2025-10-01-10', getData(1)],
                        ],
                        daily: [
                            ['2025-09-30', getData(2)],
                        ],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                },
            }],
            ['data - should move from daily to total properly', {
                storage: {
                    [locationId1]: {
                        hourly: [],
                        // should accumulate total
                        daily: [
                            // should be moved to total (30 days passed)
                            ['2025-08-01', getData(3)],
                            // should be moved to total (30 days passed - close date)
                            ['2025-08-31', getData(2)],
                            // edge case: should not be moved to total (30 days passed, but it's border time)
                            ['2025-09-01', getData(2)],
                            // should not be moved to total (30 days not passed)
                            ['2025-09-30', getData(3, 2)],
                        ],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                    // should check different locations
                    [locationId2]: {
                        hourly: [],
                        daily: [
                            // should be moved to total (30 days passed)
                            ['2025-08-31', getData(1)],
                        ],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [],
                        daily: [
                            ['2025-09-01', getData(2)],
                            ['2025-09-30', getData(3, 2)],
                        ],
                        total: getData(5),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                    [locationId2]: {
                        hourly: [],
                        daily: [],
                        total: getData(1),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                },
            }],
            ['data - should store past 30 days only', {
                storage: {
                    [locationId1]: {
                        hourly: [],
                        daily: [
                            ['2025-08-29', getData(1)], // <-- should be moved to total
                            ['2025-08-30', getData(1)], // <-- should be moved to total
                            ['2025-08-31', getData(1)], // <-- should be moved to total
                            ['2025-09-01', getData(1)],
                            ['2025-09-02', getData(1)],
                            ['2025-09-03', getData(1)],
                            ['2025-09-04', getData(1)],
                            ['2025-09-05', getData(1)],
                            ['2025-09-06', getData(1)],
                            ['2025-09-07', getData(1)],
                            ['2025-09-08', getData(1)],
                            ['2025-09-09', getData(1)],
                            ['2025-09-10', getData(1)],
                            ['2025-09-11', getData(1)],
                            ['2025-09-12', getData(1)],
                            ['2025-09-13', getData(1)],
                            ['2025-09-14', getData(1)],
                            ['2025-09-15', getData(1)],
                            ['2025-09-16', getData(1)],
                            ['2025-09-17', getData(1)],
                            ['2025-09-18', getData(1)],
                            ['2025-09-19', getData(1)],
                            ['2025-09-20', getData(1)],
                            ['2025-09-21', getData(1)],
                            ['2025-09-22', getData(1)],
                            ['2025-09-23', getData(1)],
                            ['2025-09-24', getData(1)],
                            ['2025-09-25', getData(1)],
                            ['2025-09-26', getData(1)],
                            ['2025-09-27', getData(1)],
                            ['2025-09-28', getData(1)],
                            ['2025-09-29', getData(1)],
                            ['2025-09-30', getData(1)],
                            ['2025-10-01', getData(1)],
                        ],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [],
                        daily: [
                            ['2025-09-01', getData(1)],
                            ['2025-09-02', getData(1)],
                            ['2025-09-03', getData(1)],
                            ['2025-09-04', getData(1)],
                            ['2025-09-05', getData(1)],
                            ['2025-09-06', getData(1)],
                            ['2025-09-07', getData(1)],
                            ['2025-09-08', getData(1)],
                            ['2025-09-09', getData(1)],
                            ['2025-09-10', getData(1)],
                            ['2025-09-11', getData(1)],
                            ['2025-09-12', getData(1)],
                            ['2025-09-13', getData(1)],
                            ['2025-09-14', getData(1)],
                            ['2025-09-15', getData(1)],
                            ['2025-09-16', getData(1)],
                            ['2025-09-17', getData(1)],
                            ['2025-09-18', getData(1)],
                            ['2025-09-19', getData(1)],
                            ['2025-09-20', getData(1)],
                            ['2025-09-21', getData(1)],
                            ['2025-09-22', getData(1)],
                            ['2025-09-23', getData(1)],
                            ['2025-09-24', getData(1)],
                            ['2025-09-25', getData(1)],
                            ['2025-09-26', getData(1)],
                            ['2025-09-27', getData(1)],
                            ['2025-09-28', getData(1)],
                            ['2025-09-29', getData(1)],
                            ['2025-09-30', getData(1)],
                            ['2025-10-01', getData(1)],
                        ],
                        total: getData(3),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                },
            }],

            ['duration - fully outdated session', {
                storage: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP - 2000, THRESHOLD_TIMESTAMP - 1000),
                        ],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 1000,
                    },
                },
            }],
            ['duration - partially outdated session', {
                storage: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP - 1000, THRESHOLD_TIMESTAMP + 1000),
                        ],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP, THRESHOLD_TIMESTAMP + 1000),
                        ],
                        totalDurationMs: 1000,
                    },
                },
            }],
            ['duration - not outdated session', {
                storage: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP + 1000, THRESHOLD_TIMESTAMP + 2000),
                        ],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP + 1000, THRESHOLD_TIMESTAMP + 2000),
                        ],
                        totalDurationMs: 0,
                    },
                },
                shouldNotSave: true, // should not save if no changes
            }],
            ['duration - mixed multiple sessions (fully, partially, not outdated)', {
                storage: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            // fully outdated (1000ms)
                            getSession(THRESHOLD_TIMESTAMP - 3000, THRESHOLD_TIMESTAMP - 2000),
                            // partially outdated (1000ms moved)
                            getSession(THRESHOLD_TIMESTAMP - 1000, THRESHOLD_TIMESTAMP + 1000),
                            // not outdated
                            getSession(THRESHOLD_TIMESTAMP + 2000, THRESHOLD_TIMESTAMP + 3000),
                        ],
                        totalDurationMs: 100,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP, THRESHOLD_TIMESTAMP + 1000),
                            getSession(THRESHOLD_TIMESTAMP + 2000, THRESHOLD_TIMESTAMP + 3000),
                        ],
                        totalDurationMs: 100 + 1000 + 1000, // 1200
                    },
                },
            }],
            ['duration - invalid sessions', {
                storage: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            // started > ended
                            getSession(THRESHOLD_TIMESTAMP + 1000, THRESHOLD_TIMESTAMP + 500),
                            // negative startedTimestamp
                            getSession(-100, THRESHOLD_TIMESTAMP + 500),
                            // negative endedTimestamp
                            getSession(THRESHOLD_TIMESTAMP + 500, -100),
                        ],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 0,
                    },
                },
            }],
            ['duration - session ends exactly at threshold', {
                storage: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP - 1000, THRESHOLD_TIMESTAMP),
                        ],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [],
                        totalDurationMs: 1000,
                    },
                },
            }],
            ['duration - session starts exactly at threshold', {
                storage: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP, THRESHOLD_TIMESTAMP + 1000),
                        ],
                        totalDurationMs: 0,
                    },
                },
                expected: {
                    [locationId1]: {
                        hourly: [],
                        daily: [],
                        total: getData(0),
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP, THRESHOLD_TIMESTAMP + 1000),
                        ],
                        totalDurationMs: 0,
                    },
                },
                shouldNotSave: true,
            }],
        ];

        it.each(cases)('should optimize storage properly %s', async (caseName, { storage, expected, shouldNotSave }) => {
            storageMock.get.mockResolvedValueOnce(getStatistics(storage));

            await statisticsStorage.init();

            if (shouldNotSave) {
                expect(storageMock.set).toHaveBeenCalledTimes(0);
            } else {
                expect(storageMock.set).toHaveBeenCalledTimes(1);
                expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), getStatistics(expected));
            }
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
                    hourly: [
                        ['2025-10-01-10', getData(downloadedBytes, uploadedBytes)],
                    ],
                    daily: [],
                    total: getData(0),
                    sessions: [],
                    totalDurationMs: 0,
                },
            }));
        });

        it('should add last session properly', async () => {
            const locationId = 'locationId11';

            storageMock.get.mockResolvedValueOnce(getStatistics());

            await statisticsStorage.init();

            await statisticsStorage.startDuration(locationId);

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenNthCalledWith(1, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [],
                    daily: [],
                    total: getData(0),
                    lastSession: [systemDate.getTime(), systemDate.getTime()],
                    sessions: [],
                    totalDurationMs: 0,
                },
            }));

            jest.advanceTimersByTime(1000);
            await statisticsStorage.updateDuration(locationId);

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenNthCalledWith(2, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [],
                    daily: [],
                    total: getData(0),
                    lastSession: [systemDate.getTime(), systemDate.getTime() + 1000],
                    sessions: [],
                    totalDurationMs: 0,
                },
            }));

            jest.advanceTimersByTime(1000);
            await statisticsStorage.endDuration(locationId);

            // for endDuration
            expect(storageMock.set).toHaveBeenCalledTimes(3);
            expect(storageMock.set).toHaveBeenNthCalledWith(3, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [],
                    daily: [],
                    total: getData(0),
                    sessions: [
                        [systemDate.getTime(), systemDate.getTime() + 2000],
                    ],
                    totalDurationMs: 0,
                },
            }));
        });

        it('should return statistics properly', async () => {
            const statistics = getStatistics({
                locationId: {
                    hourly: [
                        ['2025-10-01-10', getData(1)],
                    ],
                    daily: [
                        ['2025-10-01', getData(2)],
                    ],
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
                    hourly: [
                        ['2025-09-30-10', getData(1)],
                        ['2025-10-01-10', getData(1)],
                    ],
                    daily: [
                        ['2025-09-01', getData(2)],
                        ['2025-10-01', getData(2)],
                    ],
                    total: getData(3),
                },
            }));

            await statisticsStorage.init();

            // advance by 1 hour
            jest.advanceTimersByTime(ONE_HOUR_MS);

            const result1 = await statisticsStorage.getStatistics();

            expect(result1).toEqual(getStatistics({
                locationId: {
                    hourly: [
                        ['2025-10-01-10', getData(1)],
                    ],
                    daily: [
                        ['2025-09-01', getData(2)],
                        ['2025-10-01', getData(2)],
                        ['2025-09-30', getData(1)],
                    ],
                    total: getData(3),
                },
            }));

            // advance by 1 day
            jest.advanceTimersByTime(ONE_DAY_MS);

            const result2 = await statisticsStorage.getStatistics();

            expect(result2).toEqual(getStatistics({
                locationId: {
                    hourly: [],
                    daily: [
                        ['2025-10-01', getData(3)],
                        ['2025-09-30', getData(1)],
                    ],
                    total: getData(5),
                },
            }));
        });

        it('should clear statistics for the given account', async () => {
            storageMock.get.mockResolvedValueOnce(getStatistics({
                locationId: {
                    hourly: [
                        ['2025-10-01-10', getData(1)],
                    ],
                    daily: [
                        ['2025-10-01', getData(2)],
                    ],
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
