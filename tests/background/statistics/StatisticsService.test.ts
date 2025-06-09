import { StatisticsService } from '../../../src/background/statistics/StatisticsService';
import {
    StatisticsRange,
    type StatisticsByRange,
    type StatisticsData,
    type StatisticsDataTuple,
    type StatisticsSessionTuple,
    type StatisticsLocationsStorage,
} from '../../../src/background/statistics/statisticsTypes';
import { ONE_DAY_MS } from '../../../src/common/constants';

const providerMock = {
    init: jest.fn(),
};

const statisticsStorageMock = {
    init: jest.fn(),
    getStatistics: jest.fn(),
    clearStatistics: jest.fn(),
};

describe('StatisticsService', () => {
    let statisticsService: StatisticsService;
    const systemDate = new Date('2025-10-01T10:25:10Z');

    beforeEach(() => {
        statisticsService = new StatisticsService({
            // @ts-expect-error - partially mocked
            statisticsStorage: statisticsStorageMock,
            provider: providerMock,
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
     * Get statistics data tuple for testing.
     *
     * @param downloadedBytes Number of bytes downloaded.
     * @param uploadedBytes Number of bytes uploaded (Default is `downloadedBytes`).
     * @param durationMs Duration in milliseconds (Default is `downloadedBytes`).
     *
     * @returns Statistics data.
     */
    const getDataTuple = (
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

    it('should initialize properly', async () => {
        await statisticsService.init();

        // provider init
        expect(statisticsStorageMock.init).toHaveBeenCalledTimes(1);
    });

    describe('Range queries', () => {
        /**
         * Test case for range queries.
         */
        type RangeQueriesTestCase = {
            /**
             * The range to test.
             */
            range: StatisticsRange;

            /**
             * Locations storage to test.
             */
            storage: StatisticsLocationsStorage;

            /**
             * Expected range statistics.
             */
            expected: Pick<StatisticsByRange, 'total' | 'locations'>;
        };

        const cases: [string, RangeQueriesTestCase][] = [
            ['24 hours', {
                range: StatisticsRange.Hours24,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(1)],
                            ['2025-10-01-10', getDataTuple(1)],
                        ],
                        daily: [
                            ['2025-09-29', getDataTuple(1)], // <-- should not be included
                            ['2025-09-30', getDataTuple(1)], // <-- should not be included
                        ],
                        total: getDataTuple(1), // <-- should not be included
                        sessions: [
                            getSession(
                                systemDate.getTime() - ONE_DAY_MS - 2,
                                systemDate.getTime() - ONE_DAY_MS - 1,
                            ), // <-- should not be included
                            getSession(
                                systemDate.getTime() - 4,
                                systemDate.getTime() - 3,
                            ),
                            getSession(
                                systemDate.getTime() - 2,
                                systemDate.getTime() - 1,
                            ),
                        ],
                        totalDurationMs: 1, // <-- should not be included
                    },
                    locationId2: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(3)],
                            ['2025-10-01-10', getDataTuple(2)],
                        ],
                        daily: [
                            ['2025-09-29', getDataTuple(2)], // <-- should not be included
                            ['2025-09-30', getDataTuple(3)], // <-- should not be included
                        ],
                        total: getDataTuple(4), // <-- should not be included
                        sessions: [
                            getSession(
                                systemDate.getTime() - ONE_DAY_MS - 2,
                                systemDate.getTime() - ONE_DAY_MS - 1,
                            ), // <-- should not be included
                            getSession(
                                systemDate.getTime() - 7,
                                systemDate.getTime() - 5,
                            ),
                            getSession(
                                systemDate.getTime() - 4,
                                systemDate.getTime() - 1,
                            ),
                        ],
                        lastSession: getSession(
                            systemDate.getTime() - 2,
                            systemDate.getTime() - 1,
                        ),
                        totalDurationMs: 1, // <-- should not be included
                    },
                },
                expected: {
                    total: {
                        ...getData(7),
                        connectionStartedTimestamp: systemDate.getTime() - 2,
                    },
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(2),
                        },
                        {
                            locationId: 'locationId2',
                            data: {
                                ...getData(5),
                                connectionStartedTimestamp: systemDate.getTime() - 2,
                            },
                        },
                    ],
                },
            }],
            ['7 days', {
                range: StatisticsRange.Days7,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(1)],
                            ['2025-10-01-10', getDataTuple(1)],
                        ],
                        daily: [
                            ['2025-09-22', getDataTuple(1)], // <-- should not be included
                            ['2025-09-23', getDataTuple(1)], // <-- should not be included
                            ['2025-09-24', getDataTuple(1)],
                            ['2025-09-25', getDataTuple(1)],
                            ['2025-09-26', getDataTuple(1)],
                            ['2025-09-27', getDataTuple(1)],
                            ['2025-09-28', getDataTuple(1)],
                            ['2025-09-29', getDataTuple(1)],
                            ['2025-09-30', getDataTuple(1)],
                        ],
                        total: getDataTuple(1), // <-- should not be included
                        sessions: [
                            getSession(
                                systemDate.getTime() - 7 * ONE_DAY_MS - 2,
                                systemDate.getTime() - 7 * ONE_DAY_MS - 1,
                            ), // <-- should not be included
                            getSession(
                                systemDate.getTime() - 2 * ONE_DAY_MS - 4,
                                systemDate.getTime() - 2 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - ONE_DAY_MS - 4,
                                systemDate.getTime() - ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 5,
                                systemDate.getTime() - 3,
                            ),
                            getSession(
                                systemDate.getTime() - 2,
                                systemDate.getTime() - 1,
                            ),
                        ],
                        totalDurationMs: 1, // <-- should not be included
                    },
                    locationId2: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(3)],
                            ['2025-10-01-10', getDataTuple(2)],
                        ],
                        daily: [
                            ['2025-09-23', getDataTuple(1)], // <-- should not be included
                            ['2025-09-24', getDataTuple(1)],
                            ['2025-09-25', getDataTuple(1)],
                            ['2025-09-29', getDataTuple(2)],
                            ['2025-09-30', getDataTuple(3)],
                        ],
                        total: getDataTuple(4), // <-- should not be included
                        sessions: [
                            getSession(
                                systemDate.getTime() - 7 * ONE_DAY_MS - 2,
                                systemDate.getTime() - 7 * ONE_DAY_MS - 1,
                            ), // <-- should not be included
                            getSession(
                                systemDate.getTime() - 2 * ONE_DAY_MS - 4,
                                systemDate.getTime() - 2 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - ONE_DAY_MS - 4,
                                systemDate.getTime() - ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 8,
                                systemDate.getTime() - 5,
                            ),
                            getSession(
                                systemDate.getTime() - 4,
                                systemDate.getTime() - 1,
                            ),
                        ],
                        totalDurationMs: 1, // <-- should not be included
                    },
                },
                expected: {
                    total: getData(21),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(9),
                        },
                        {
                            locationId: 'locationId2',
                            data: getData(12),
                        },
                    ],
                },
            }],
            ['30 days', {
                range: StatisticsRange.Days30,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(1)],
                            ['2025-10-01-10', getDataTuple(1)],
                        ],
                        daily: [
                            ['2025-09-29', getDataTuple(1)],
                            ['2025-09-30', getDataTuple(1)],
                        ],
                        total: getDataTuple(1),
                        sessions: [
                            getSession(
                                systemDate.getTime() - 30 * ONE_DAY_MS - 2,
                                systemDate.getTime() - 30 * ONE_DAY_MS - 1,
                            ), // <-- should not be included
                            getSession(
                                systemDate.getTime() - 12 * ONE_DAY_MS - 2,
                                systemDate.getTime() - 12 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 7 * ONE_DAY_MS - 2,
                                systemDate.getTime() - 7 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 2 * ONE_DAY_MS - 2,
                                systemDate.getTime() - 2 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 2,
                                systemDate.getTime() - 1,
                            ),
                        ],
                        totalDurationMs: 1, // <-- should not be included
                    },
                    locationId2: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(3)],
                            ['2025-10-01-10', getDataTuple(2)],
                        ],
                        daily: [
                            ['2025-09-29', getDataTuple(2)],
                            ['2025-09-30', getDataTuple(3)],
                        ],
                        total: getDataTuple(4),
                        sessions: [
                            getSession(
                                systemDate.getTime() - 30 * ONE_DAY_MS - 2,
                                systemDate.getTime() - 30 * ONE_DAY_MS - 1,
                            ), // <-- should not be included
                            getSession(
                                systemDate.getTime() - 12 * ONE_DAY_MS - 4,
                                systemDate.getTime() - 12 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 7 * ONE_DAY_MS - 4,
                                systemDate.getTime() - 7 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 2 * ONE_DAY_MS - 3,
                                systemDate.getTime() - 2 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 3,
                                systemDate.getTime() - 1,
                            ),
                        ],
                        totalDurationMs: 1, // <-- should not be included
                    },
                },
                expected: {
                    total: getData(14),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(4),
                        },
                        {
                            locationId: 'locationId2',
                            data: getData(10),
                        },
                    ],
                },
            }],
            ['all time', {
                range: StatisticsRange.AllTime,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(1)],
                            ['2025-10-01-10', getDataTuple(1)],
                        ],
                        daily: [
                            ['2025-09-29', getDataTuple(1)],
                            ['2025-09-30', getDataTuple(1)],
                        ],
                        total: getDataTuple(1),
                        sessions: [
                            getSession(
                                systemDate.getTime() - 300 * ONE_DAY_MS - 3,
                                systemDate.getTime() - 300 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 12 * ONE_DAY_MS - 2,
                                systemDate.getTime() - 12 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 2,
                                systemDate.getTime() - 1,
                            ),
                        ],
                        totalDurationMs: 1,
                    },
                    locationId2: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(3)],
                            ['2025-10-01-10', getDataTuple(2)],
                        ],
                        daily: [
                            ['2025-09-29', getDataTuple(2)],
                            ['2025-09-30', getDataTuple(3)],
                        ],
                        total: getDataTuple(4),
                        sessions: [
                            getSession(
                                systemDate.getTime() - 300 * ONE_DAY_MS - 6,
                                systemDate.getTime() - 300 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 12 * ONE_DAY_MS - 5,
                                systemDate.getTime() - 12 * ONE_DAY_MS - 1,
                            ),
                            getSession(
                                systemDate.getTime() - 5,
                                systemDate.getTime() - 1,
                            ),
                        ],
                        totalDurationMs: 1,
                    },
                },
                expected: {
                    total: getData(19),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(5),
                        },
                        {
                            locationId: 'locationId2',
                            data: getData(14),
                        },
                    ],
                },
            }],
        ];

        it.each(cases)('should correctly calculate range - %s', async (caseName, { range, storage, expected }) => {
            statisticsStorageMock.getStatistics.mockResolvedValueOnce({
                startedTimestamp: 12345,
                locations: storage,
            });

            await statisticsService.init();

            const result = await statisticsService.getStatsByRange(range);

            expect(result).toEqual({
                ...expected,
                startedTimestamp: 12345,
            });
        });
    });
});
