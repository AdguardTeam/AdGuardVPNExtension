import { StatisticsService } from '../../../src/background/statistics/StatisticsService';
import {
    StatisticsRange,
    type StatisticsByRange,
    type StatisticsData,
    type StatisticsTuple,
    type StatisticsDataTuple,
    type StatisticsSessionTuple,
    type StatisticsLocationsStorage,
} from '../../../src/background/statistics/statisticsTypes';
import { ONE_DAY_MS } from '../../../src/common/constants';

const providerMock = {
    init: jest.fn(),
    setIsDisabled: jest.fn(),
    getIsDisabled: jest.fn().mockReturnValue(false),
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
     * Get statistics data tuple for testing.
     *
     * @param downloadedBytes Number of bytes downloaded.
     * @param uploadedBytes Number of bytes uploaded (Default is `downloadedBytes`).
     * @param durationMs Duration in milliseconds (Default is `downloadedBytes`).
     *
     * @returns Statistics data.
     */
    const getTotalDataTuple = (
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

    it('should initialize properly', async () => {
        await statisticsService.init();

        // provider init
        expect(statisticsStorageMock.init).toHaveBeenCalledTimes(1);
    });

    it('should forward methods to provider', async () => {
        await statisticsService.init();

        // setIsDisabled
        await statisticsService.setIsDisabled(true);
        expect(providerMock.setIsDisabled).toHaveBeenCalledWith(true);
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
            ['24 hours range', {
                range: StatisticsRange.Hours24,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2025-09-29-10', getDataTuple(1)], // <-- should not be included
                            ['2025-09-30-09', getDataTuple(1)], // <-- should not be included
                            ['2025-10-01-09', getDataTuple(1)],
                            ['2025-10-01-10', getDataTuple(1)],
                        ],
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
                        total: getTotalDataTuple(1), // <-- should not be included
                    },
                },
                expected: {
                    total: getData(2),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(2),
                        },
                    ],
                },
            }],
            ['7 days range', {
                range: StatisticsRange.Days7,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2025-09-23-10', getDataTuple(3)], // <-- should not be included
                            ['2025-09-25-09', getDataTuple(5)],
                            ['2025-10-01-09', getDataTuple(2)],
                            ['2025-10-01-10', getDataTuple(3)],
                        ],
                        sessions: [
                            getSession(
                                systemDate.getTime() - (8 * ONE_DAY_MS),
                                systemDate.getTime() - (7.5 * ONE_DAY_MS),
                            ), // <-- should not be included
                            getSession(
                                systemDate.getTime() - (6 * ONE_DAY_MS),
                                systemDate.getTime() - (6 * ONE_DAY_MS - 5),
                            ),
                            getSession(
                                systemDate.getTime() - 10,
                                systemDate.getTime() - 5,
                            ),
                        ],
                        total: getTotalDataTuple(10), // <-- should not be included
                    },
                },
                expected: {
                    total: getData(10),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(10),
                        },
                    ],
                },
            }],
            ['30 days range', {
                range: StatisticsRange.Days30,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2025-09-01-10', getDataTuple(2)],
                            ['2025-09-15-09', getDataTuple(3)],
                            ['2025-10-01-09', getDataTuple(4)],
                        ],
                        sessions: [
                            getSession(
                                systemDate.getTime() - (31 * ONE_DAY_MS),
                                systemDate.getTime() - (30.5 * ONE_DAY_MS),
                            ), // <-- should not be included
                            getSession(
                                systemDate.getTime() - (25 * ONE_DAY_MS),
                                systemDate.getTime() - (25 * ONE_DAY_MS - 5),
                            ),
                            getSession(
                                systemDate.getTime() - (15 * ONE_DAY_MS),
                                systemDate.getTime() - (15 * ONE_DAY_MS - 4),
                            ),
                        ],
                        total: getTotalDataTuple(10), // <-- should not be included
                    },
                },
                expected: {
                    total: getData(9),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(9),
                        },
                    ],
                },
            }],
            ['All time range', {
                range: StatisticsRange.AllTime,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2024-09-01-10', getDataTuple(1)],
                            ['2025-09-15-09', getDataTuple(2)],
                            ['2025-10-01-09', getDataTuple(3)],
                        ],
                        sessions: [
                            getSession(
                                systemDate.getTime() - (365 * ONE_DAY_MS),
                                systemDate.getTime() - (365 * ONE_DAY_MS - 3),
                            ),
                            getSession(
                                systemDate.getTime() - (30 * ONE_DAY_MS),
                                systemDate.getTime() - (30 * ONE_DAY_MS - 3),
                            ),
                        ],
                        total: getTotalDataTuple(50),
                    },
                },
                expected: {
                    total: getData(56),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(56),
                        },
                    ],
                },
            }],
            ['Empty storage', {
                range: StatisticsRange.Hours24,
                storage: {},
                expected: {
                    total: getData(0),
                    locations: [],
                },
            }],
            ['Partially within threshold (24 hours)', {
                range: StatisticsRange.Hours24,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2025-09-30-10', getDataTuple(5)],
                            ['2025-10-01-09', getDataTuple(3)],
                        ],
                        sessions: [
                            getSession(
                                systemDate.getTime() - ONE_DAY_MS - 5000,
                                systemDate.getTime() - ONE_DAY_MS + 5000,
                            ),
                        ],
                        total: getTotalDataTuple(10),
                    },
                },
                expected: {
                    total: getData(8, 8, 5000),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(8, 8, 5000),
                        },
                    ],
                },
            }],
            ['Active connection', {
                range: StatisticsRange.Hours24,
                storage: {
                    locationId1: {
                        hourly: [],
                        sessions: [
                            getSession(
                                systemDate.getTime() - 1000,
                                systemDate.getTime() - 500,
                            ),
                        ],
                        lastSession: getSession(
                            systemDate.getTime() - 200,
                            systemDate.getTime(),
                        ),
                        total: getTotalDataTuple(10),
                    },
                },
                expected: {
                    total: {
                        ...getData(0, 0, 500),
                        connectionStartedTimestamp: systemDate.getTime() - 200,
                    },
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: {
                                ...getData(0, 0, 500),
                                connectionStartedTimestamp: systemDate.getTime() - 200,
                            },
                        },
                    ],
                },
            }],
            ['Mixed sessions and hourly data', {
                range: StatisticsRange.Hours24,
                storage: {
                    locationId1: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(3, 4)],
                        ],
                        sessions: [
                            getSession(
                                systemDate.getTime() - 5000,
                                systemDate.getTime() - 1000,
                            ),
                        ],
                        total: getTotalDataTuple(10),
                    },
                    locationId2: {
                        hourly: [],
                        sessions: [
                            getSession(
                                systemDate.getTime() - 3000,
                                systemDate.getTime() - 1000,
                            ),
                        ],
                        total: getTotalDataTuple(5),
                    },
                    locationId3: {
                        hourly: [
                            ['2025-10-01-09', getDataTuple(2, 1)],
                        ],
                        sessions: [],
                        total: getTotalDataTuple(5),
                    },
                },
                expected: {
                    total: getData(5, 5, 6000),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(3, 4, 4000),
                        },
                        {
                            locationId: 'locationId2',
                            data: getData(0, 0, 2000),
                        },
                        {
                            locationId: 'locationId3',
                            data: getData(2, 1, 0),
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
                isDisabled: false,
                startedTimestamp: 12345,
            });
        });
    });
});
