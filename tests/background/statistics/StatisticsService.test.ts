import { StatisticsService } from '../../../src/background/statistics/StatisticsService';
import {
    type StatisticsAccountStorage,
    StatisticsRange,
    type RangeAccountStatistics,
} from '../../../src/background/statistics/statisticsTypes';

const storageMock = {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
};

const providerMock = {
    init: jest.fn(),
    getAccountStatistics: jest.fn(),
    clearAccountStatistics: jest.fn(),
};

const credentialsMock = {
    getUsername: jest.fn().mockResolvedValue('test@adguard.com'),
};

describe('StatisticsService', () => {
    let statisticsService: StatisticsService;
    const systemDate = new Date('2025-10-01T10:25:10Z');

    beforeEach(() => {
        statisticsService = new StatisticsService({
            storage: storageMock,
            provider: providerMock,
            // @ts-expect-error - partially mocked
            credentials: credentialsMock,
        });
        jest.useFakeTimers('modern').setSystemTime(systemDate);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it('should initialize properly', async () => {
        await statisticsService.init();

        // provider init
        expect(providerMock.init).toHaveBeenCalledTimes(1);

        // get range
        expect(storageMock.get).toHaveBeenCalledTimes(1);

        // save range (because it was empty)
        expect(storageMock.set).toHaveBeenCalledTimes(1);
    });

    it('should read range from local storage', async () => {
        storageMock.get.mockResolvedValueOnce(StatisticsRange.Hours24);

        await statisticsService.init();

        // get range
        expect(storageMock.get).toHaveBeenCalledTimes(1);

        // should not save range, because it was already in storage
        expect(storageMock.set).not.toHaveBeenCalled();

        // @ts-expect-error - private property
        expect(statisticsService.range).toBe(StatisticsRange.Hours24);
    });

    it('should return null for all statistics if user is not authenticated', async () => {
        credentialsMock.getUsername.mockResolvedValueOnce(null);

        await statisticsService.init();

        const result = await statisticsService.getAllStatistics();

        expect(result).toEqual(null);
    });

    it('should return null for all statistics if collection is not started', async () => {
        providerMock.getAccountStatistics.mockResolvedValueOnce(null);

        await statisticsService.init();

        const result = await statisticsService.getAllStatistics();

        expect(result).toEqual(null);
    });

    it('should return empty stats for all statistics if collection started but no data yet', async () => {
        storageMock.get.mockResolvedValueOnce(StatisticsRange.AllTime);
        providerMock.getAccountStatistics.mockResolvedValueOnce({
            startedTimestamp: 12345,
            accountStorage: undefined,
        });

        await statisticsService.init();

        const result = await statisticsService.getAllStatistics();

        expect(result).toEqual({
            startedTimestamp: 12345,
            range: StatisticsRange.AllTime,
            total: {
                downloaded: 0,
                uploaded: 0,
                duration: 0,
            },
            locations: [],
        });
    });

    describe('Range queries', () => {
        const getData = (
            downloaded: number,
            uploaded = downloaded,
            duration = downloaded,
        ) => ({
            downloaded,
            uploaded,
            duration,
        });

        type RangeQueriesTestCase = {
            range: StatisticsRange;
            accountStorage: StatisticsAccountStorage;
            expected: RangeAccountStatistics;
        };

        const cases: RangeQueriesTestCase[] = [
            // 24 hours
            {
                range: StatisticsRange.Hours24,
                accountStorage: {
                    locationId1: {
                        hourly: {
                            '2025-10-01-10': getData(1),
                            '2025-10-01-09': getData(1),
                        },
                        daily: {
                            '2025-09-30': getData(1),
                            '2025-09-29': getData(1),
                        },
                        total: getData(1),
                    },
                    locationId2: {
                        hourly: {
                            '2025-10-01-10': getData(2),
                            '2025-10-01-09': getData(3),
                        },
                        daily: {
                            '2025-09-30': getData(3),
                            '2025-09-29': getData(2),
                        },
                        total: getData(4),
                    },
                },
                expected: {
                    total: getData(7),
                    locations: [
                        {
                            locationId: 'locationId1',
                            data: getData(2),
                        },
                        {
                            locationId: 'locationId2',
                            data: getData(5),
                        },
                    ],
                },
            },
            // 7 days
            {
                range: StatisticsRange.Days7,
                accountStorage: {
                    locationId1: {
                        hourly: {
                            '2025-10-01-10': getData(1),
                            '2025-10-01-09': getData(1),
                        },
                        daily: {
                            '2025-09-30': getData(1),
                            '2025-09-29': getData(1),
                            '2025-09-28': getData(1),
                            '2025-09-27': getData(1),
                            '2025-09-26': getData(1),
                            '2025-09-25': getData(1),
                            '2025-09-24': getData(1),
                            '2025-09-23': getData(1), // <-- should not be included
                            '2025-09-22': getData(1), // <-- should not be included
                        },
                        total: getData(1),
                    },
                    locationId2: {
                        hourly: {
                            '2025-10-01-10': getData(2),
                            '2025-10-01-09': getData(3),
                        },
                        daily: {
                            '2025-09-30': getData(3),
                            '2025-09-29': getData(2),
                            '2025-09-25': getData(1),
                            '2025-09-24': getData(1),
                            '2025-09-23': getData(1), // <-- should not be included
                        },
                        total: getData(4),
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
            },
            // 30 days
            {
                range: StatisticsRange.Days30,
                accountStorage: {
                    locationId1: {
                        hourly: {
                            '2025-10-01-10': getData(1),
                            '2025-10-01-09': getData(1),
                        },
                        daily: {
                            '2025-09-30': getData(1),
                            '2025-09-29': getData(1),
                        },
                        total: getData(1),
                    },
                    locationId2: {
                        hourly: {
                            '2025-10-01-10': getData(2),
                            '2025-10-01-09': getData(3),
                        },
                        daily: {
                            '2025-09-30': getData(3),
                            '2025-09-29': getData(2),
                        },
                        total: getData(4),
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
            },
            // AllTime
            {
                range: StatisticsRange.AllTime,
                accountStorage: {
                    locationId1: {
                        hourly: {
                            '2025-10-01-10': getData(1),
                            '2025-10-01-09': getData(1),
                        },
                        daily: {
                            '2025-09-30': getData(1),
                            '2025-09-29': getData(1),
                        },
                        total: getData(1),
                    },
                    locationId2: {
                        hourly: {
                            '2025-10-01-10': getData(2),
                            '2025-10-01-09': getData(3),
                        },
                        daily: {
                            '2025-09-30': getData(3),
                            '2025-09-29': getData(2),
                        },
                        total: getData(4),
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
            },
        ];

        it.each(cases)('should correctly calculate range', async ({ range, accountStorage, expected }) => {
            storageMock.get.mockResolvedValueOnce(range);
            providerMock.getAccountStatistics.mockResolvedValueOnce({
                startedTimestamp: 12345,
                accountStorage,
            });

            await statisticsService.init();

            const result = await statisticsService.getRangeStatistics(range);

            // should update range in local storage
            expect(storageMock.set).toHaveBeenCalledWith(expect.any(String), range);
            expect(result).toEqual(expected);
        });
    });
});
