import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
} from 'vitest';

import { StatisticsStorage } from '../../../src/background/statistics/StatisticsStorage';
import {
    type Statistics,
    type StatisticsTuple,
    type StatisticsDataTuple,
    type StatisticsSessionTuple,
    type StatisticsLocationsStorage,
} from '../../../src/background/statistics/statisticsTypes';
import { ONE_DAY_MS, ONE_HOUR_MS } from '../../../src/common/constants';

vi.mock('lodash/throttle', () => ({
    default: vi.fn((fn) => fn),
}));

const storageMock = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
};

describe('StatisticsStorage', () => {
    let statisticsStorage: StatisticsStorage;
    const systemDate = new Date('2025-10-01T10:25:10Z');

    beforeEach(() => {
        statisticsStorage = new StatisticsStorage({
            storage: storageMock,
        });
        vi.useFakeTimers().setSystemTime(systemDate);
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
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
     * Get statistics total data for testing.
     *
     * @param downloadedBytes Number of bytes downloaded.
     * @param uploadedBytes Number of bytes uploaded (Default is `downloadedBytes`).
     * @param durationMs Number of duration milliseconds.
     *
     * @returns Statistics data.
     */
    const getTotalData = (
        downloadedBytes: number,
        uploadedBytes = downloadedBytes,
        durationMs = downloadedBytes,
    ): StatisticsTuple => ([
        downloadedBytes,
        uploadedBytes,
        durationMs,
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

        it('should move last session after termination without disconnection', async () => {
            const locationId = 'locationId1';
            const statistics = getStatistics({
                [locationId]: {
                    hourly: [],
                    sessions: [],
                    total: getTotalData(0),
                    lastSession: [systemDate.getTime() - 1000, systemDate.getTime()],
                },
            });

            storageMock.get.mockResolvedValueOnce(statistics);

            await statisticsStorage.init();

            expect(storageMock.get).toHaveBeenCalledTimes(1);
            expect(storageMock.get).toHaveBeenCalledWith(expect.any(String));

            expect(storageMock.set).toHaveBeenCalledTimes(1);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [],
                    sessions: [[systemDate.getTime() - 1000, systemDate.getTime()]],
                    total: getTotalData(0),
                },
            }));
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
        };

        const locationId = 'locationId';
        const NOW = systemDate.getTime();
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const THRESHOLD_TIMESTAMP = NOW - THIRTY_DAYS_MS;

        const cases: [string, OptimizationCase][] = [
            ['data - should move from hourly to total properly', {
                storage: {
                    [locationId]: {
                        hourly: [
                            ['2025-09-01-09', getData(1, 2)],
                            ['2025-09-28-23', getData(3, 2)],
                            ['2025-09-29-01', getData(3)],
                            ['2025-09-30-09', getData(2)],
                            ['2025-09-30-10', getData(3)],
                            ['2025-09-30-11', getData(3, 2)],
                        ],
                        sessions: [],
                        total: getTotalData(0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [
                            ['2025-09-28-23', getData(3, 2)],
                            ['2025-09-29-01', getData(3)],
                            ['2025-09-30-09', getData(2)],
                            ['2025-09-30-10', getData(3)],
                            ['2025-09-30-11', getData(3, 2)],
                        ],
                        sessions: [],
                        total: getTotalData(1, 2, 0),
                    },
                },
            }],
            ['data - all hourly data is older than threshold (everything moves to total)', {
                storage: {
                    [locationId]: {
                        hourly: [
                            ['2025-08-01-09', getData(10, 5)],
                            ['2025-08-10-23', getData(20, 15)],
                            ['2025-08-15-01', getData(30, 25)],
                        ],
                        sessions: [],
                        total: getTotalData(5, 5, 0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [],
                        sessions: [],
                        total: getTotalData(65, 50, 0),
                    },
                },
            }],
            ['data - all hourly data is newer than threshold (nothing moves to total)', {
                storage: {
                    [locationId]: {
                        hourly: [
                            ['2025-09-28-23', getData(3, 2)],
                            ['2025-09-29-01', getData(3)],
                            ['2025-09-30-09', getData(2)],
                        ],
                        sessions: [],
                        total: getTotalData(10, 10, 0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [
                            ['2025-09-28-23', getData(3, 2)],
                            ['2025-09-29-01', getData(3)],
                            ['2025-09-30-09', getData(2)],
                        ],
                        sessions: [],
                        total: getTotalData(10, 10, 0),
                    },
                },
            }],
            ['data - with invalid date formats in hourly data (should be removed)', {
                storage: {
                    [locationId]: {
                        hourly: [
                            ['invalid-date', getData(10, 5)],
                            ['2025-09-28-23', getData(3, 2)],
                            ['malformed-2025-01', getData(20, 15)],
                            ['2025-09-30-09', getData(2)],
                        ],
                        sessions: [],
                        total: getTotalData(5, 5, 0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [
                            ['2025-09-28-23', getData(3, 2)],
                            ['2025-09-30-09', getData(2)],
                        ],
                        sessions: [],
                        total: getTotalData(5, 5, 0),
                    },
                },
            }],
            ['data - with future dates in hourly data (should be removed)', {
                storage: {
                    [locationId]: {
                        hourly: [
                            ['2025-09-28-23', getData(3, 2)],
                            ['2025-12-31-23', getData(10, 5)], // Future date compared to NOW
                            ['2025-09-30-09', getData(2)],
                        ],
                        sessions: [],
                        total: getTotalData(5, 5, 0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [
                            ['2025-09-28-23', getData(3, 2)],
                            ['2025-09-30-09', getData(2)],
                        ],
                        sessions: [],
                        total: getTotalData(5, 5, 0),
                    },
                },
            }],
            ['data - with empty hourly data (nothing to move)', {
                storage: {
                    [locationId]: {
                        hourly: [],
                        sessions: [],
                        total: getTotalData(10, 10, 0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [],
                        sessions: [],
                        total: getTotalData(10, 10, 0),
                    },
                },
            }],
            ['data - edge case with data exactly at threshold (should not move)', {
                storage: {
                    [locationId]: {
                        hourly: [
                            // Date exactly at threshold (30 days ago)
                            ['2025-09-01-10', getData(5, 3)],
                            ['2025-09-30-09', getData(2)],
                        ],
                        sessions: [],
                        total: getTotalData(10, 10, 0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [
                            ['2025-09-01-10', getData(5, 3)],
                            ['2025-09-30-09', getData(2)],
                        ],
                        sessions: [],
                        total: getTotalData(10, 10, 0),
                    },
                },
            }],
            ['data - mixed case with old, threshold, and new data', {
                storage: {
                    [locationId]: {
                        hourly: [
                            ['2025-08-01-09', getData(10, 5)], // Old data (to be moved)
                            ['2025-09-01-10', getData(5, 3)], // At threshold (keep)
                            ['2025-09-30-09', getData(2)], // New data (keep)
                        ],
                        sessions: [],
                        total: getTotalData(5, 5, 0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [
                            ['2025-09-01-10', getData(5, 3)],
                            ['2025-09-30-09', getData(2)],
                        ],
                        sessions: [],
                        total: getTotalData(15, 10, 0), // Added old data to total
                    },
                },
            }],

            ['duration - fully outdated session', {
                storage: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP - 2000, THRESHOLD_TIMESTAMP - 1000),
                        ],
                        total: getTotalData(0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [],
                        sessions: [],
                        total: getTotalData(0, 0, 1000),
                    },
                },
            }],
            ['duration - partially outdated session', {
                storage: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP - 1000, THRESHOLD_TIMESTAMP + 1000),
                        ],
                        total: getTotalData(0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP, THRESHOLD_TIMESTAMP + 1000),
                        ],
                        total: getTotalData(0, 0, 1000),
                    },
                },
            }],
            ['duration - not outdated session', {
                storage: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP + 1000, THRESHOLD_TIMESTAMP + 2000),
                        ],
                        total: getTotalData(0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP + 1000, THRESHOLD_TIMESTAMP + 2000),
                        ],
                        total: getTotalData(0),
                    },
                },
            }],
            ['duration - mixed multiple sessions (fully, partially, not outdated)', {
                storage: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            // fully outdated (1000ms)
                            getSession(THRESHOLD_TIMESTAMP - 3000, THRESHOLD_TIMESTAMP - 2000),
                            // partially outdated (1000ms moved)
                            getSession(THRESHOLD_TIMESTAMP - 1000, THRESHOLD_TIMESTAMP + 1000),
                            // not outdated
                            getSession(THRESHOLD_TIMESTAMP + 2000, THRESHOLD_TIMESTAMP + 3000),
                        ],
                        total: getTotalData(0, 0, 100),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP, THRESHOLD_TIMESTAMP + 1000),
                            getSession(THRESHOLD_TIMESTAMP + 2000, THRESHOLD_TIMESTAMP + 3000),
                        ],
                        total: getTotalData(0, 0, 100 + 1000 + 1000), // 1200
                    },
                },
            }],
            ['duration - invalid sessions', {
                storage: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            // started > ended
                            getSession(THRESHOLD_TIMESTAMP + 1000, THRESHOLD_TIMESTAMP + 500),
                            // negative startedTimestamp
                            getSession(-100, THRESHOLD_TIMESTAMP + 500),
                            // negative endedTimestamp
                            getSession(THRESHOLD_TIMESTAMP + 500, -100),
                        ],
                        total: getTotalData(0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [],
                        sessions: [],
                        total: getTotalData(0),
                    },
                },
            }],
            ['duration - session ends exactly at threshold', {
                storage: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP - 1000, THRESHOLD_TIMESTAMP),
                        ],
                        total: getTotalData(0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [],
                        sessions: [],
                        total: getTotalData(0, 0, 1000),
                    },
                },
            }],
            ['duration - session starts exactly at threshold', {
                storage: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP, THRESHOLD_TIMESTAMP + 1000),
                        ],
                        total: getTotalData(0),
                    },
                },
                expected: {
                    [locationId]: {
                        hourly: [],
                        sessions: [
                            getSession(THRESHOLD_TIMESTAMP, THRESHOLD_TIMESTAMP + 1000),
                        ],
                        total: getTotalData(0),
                    },
                },
            }],
        ];

        it.each(cases)('should optimize storage properly %s', async (caseName, { storage, expected }) => {
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

            // for init
            expect(storageMock.set).toHaveBeenCalledTimes(1);

            await statisticsStorage.addTraffic(locationId, {
                downloadedBytes,
                uploadedBytes,
            });

            // for addTraffic
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [
                        ['2025-10-01-10', getData(downloadedBytes, uploadedBytes)],
                    ],
                    sessions: [],
                    total: getTotalData(0),
                },
            }));
        });

        it('should update last session time when adding traffic', async () => {
            const locationId = 'locationId10';
            const downloadedBytes = 1111;
            const uploadedBytes = 2222;

            storageMock.get.mockResolvedValueOnce(getStatistics());

            await statisticsStorage.init();

            // for init
            expect(storageMock.set).toHaveBeenCalledTimes(1);

            await statisticsStorage.startDuration(locationId);

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(2);

            vi.advanceTimersByTime(1000);

            await statisticsStorage.addTraffic(locationId, {
                downloadedBytes,
                uploadedBytes,
            });

            // for addTraffic
            expect(storageMock.set).toHaveBeenCalledTimes(3);
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [
                        ['2025-10-01-10', getData(downloadedBytes, uploadedBytes)],
                    ],
                    sessions: [],
                    total: getTotalData(0),
                    lastSession: [systemDate.getTime(), systemDate.getTime() + 1000],
                },
            }));
        });

        it('should add last session properly', async () => {
            const locationId = 'locationId11';

            storageMock.get.mockResolvedValueOnce(getStatistics());

            await statisticsStorage.init();

            expect(storageMock.set).toHaveBeenCalledTimes(1);

            // for init
            await statisticsStorage.startDuration(locationId);

            // for startDuration
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenNthCalledWith(2, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [],
                    sessions: [],
                    total: getTotalData(0),
                    lastSession: [systemDate.getTime(), systemDate.getTime()],
                },
            }));

            vi.advanceTimersByTime(1000);
            await statisticsStorage.updateDuration(locationId);

            // for updateDuration
            expect(storageMock.set).toHaveBeenCalledTimes(3);
            expect(storageMock.set).toHaveBeenNthCalledWith(3, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [],
                    sessions: [],
                    total: getTotalData(0),
                    lastSession: [systemDate.getTime(), systemDate.getTime() + 1000],
                },
            }));

            vi.advanceTimersByTime(1000);
            await statisticsStorage.endDuration(locationId);

            // for endDuration
            expect(storageMock.set).toHaveBeenCalledTimes(4);
            expect(storageMock.set).toHaveBeenNthCalledWith(4, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [],
                    sessions: [
                        [systemDate.getTime(), systemDate.getTime() + 2000],
                    ],
                    total: getTotalData(0),
                },
            }));
        });

        it('should move last session if it was already defined', async () => {
            const locationId = 'locationId11';

            storageMock.get.mockResolvedValueOnce(getStatistics());

            await statisticsStorage.init();

            // for init
            expect(storageMock.set).toHaveBeenCalledTimes(1);

            await statisticsStorage.startDuration(locationId);

            // for startDuration (1)
            expect(storageMock.set).toHaveBeenCalledTimes(2);
            expect(storageMock.set).toHaveBeenNthCalledWith(2, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [],
                    sessions: [],
                    total: getTotalData(0),
                    lastSession: [systemDate.getTime(), systemDate.getTime()],
                },
            }));

            vi.advanceTimersByTime(1000);
            await statisticsStorage.startDuration(locationId);

            // for startDuration (2)
            expect(storageMock.set).toHaveBeenCalledTimes(3);
            expect(storageMock.set).toHaveBeenNthCalledWith(3, expect.any(String), getStatistics({
                [locationId]: {
                    hourly: [],
                    sessions: [[systemDate.getTime(), systemDate.getTime()]],
                    total: getTotalData(0),
                    lastSession: [systemDate.getTime() + 1000, systemDate.getTime() + 1000],
                },
            }));
        });

        it('should return statistics properly', async () => {
            const statistics = getStatistics({
                locationId: {
                    hourly: [
                        ['2025-10-01-10', getData(1)],
                    ],
                    sessions: [
                        getSession(systemDate.getTime() - 1000, systemDate.getTime()),
                    ],
                    total: getTotalData(3),
                },
            });

            storageMock.get.mockResolvedValueOnce(statistics);

            await statisticsStorage.init();

            const result = await statisticsStorage.getStatistics();

            expect(result).toEqual(statistics);
        });

        it('should return updated storage after time', async () => {
            storageMock.get.mockResolvedValueOnce(getStatistics({
                locationId: {
                    hourly: [
                        ['2025-08-30-09', getData(1)],
                        ['2025-09-01-11', getData(1)],
                        ['2025-09-30-10', getData(1)],
                        ['2025-10-01-10', getData(1)],
                    ],
                    sessions: [
                        getSession(systemDate.getTime() - 1000, systemDate.getTime()),
                    ],
                    total: getTotalData(3, 3, 1000),
                },
            }));

            await statisticsStorage.init();

            // advance by 1 hour
            vi.advanceTimersByTime(ONE_HOUR_MS);

            const result1 = await statisticsStorage.getStatistics();

            expect(result1).toEqual(getStatistics({
                locationId: {
                    hourly: [
                        ['2025-09-01-11', getData(1)],
                        ['2025-09-30-10', getData(1)],
                        ['2025-10-01-10', getData(1)],
                    ],
                    sessions: [
                        getSession(systemDate.getTime() - 1000, systemDate.getTime()),
                    ],
                    total: getTotalData(4, 4, 1000),
                },
            }));

            // advance by 1 day
            vi.advanceTimersByTime(ONE_DAY_MS);

            const result2 = await statisticsStorage.getStatistics();

            expect(result2).toEqual(getStatistics({
                locationId: {
                    hourly: [
                        ['2025-09-30-10', getData(1)],
                        ['2025-10-01-10', getData(1)],
                    ],
                    sessions: [
                        getSession(systemDate.getTime() - 1000, systemDate.getTime()),
                    ],
                    total: getTotalData(5, 5, 1000),
                },
            }));

            // advance by 30 days
            vi.advanceTimersByTime(30 * ONE_DAY_MS);

            const result3 = await statisticsStorage.getStatistics();

            expect(result3).toEqual(getStatistics({
                locationId: {
                    hourly: [],
                    sessions: [],
                    total: getTotalData(7, 7, 2000),
                },
            }));
        });

        it('should clear statistics', async () => {
            storageMock.get.mockResolvedValueOnce(getStatistics({
                locationId: {
                    hourly: [
                        ['2025-10-01-10', getData(1)],
                    ],
                    sessions: [
                        getSession(systemDate.getTime() - 1000, systemDate.getTime()),
                    ],
                    total: getTotalData(3),
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
