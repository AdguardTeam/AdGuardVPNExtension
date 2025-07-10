import { ConnectivityStateType } from '../../../src/background/schema';
import { StatisticsProvider } from '../../../src/background/statistics/StatisticsProvider';
import { notifier } from '../../../src/common/notifier';

jest.mock('../../../src/common/notifier', () => ({
    ...jest.requireActual('../../../src/common/notifier'),
    addSpecifiedListener: jest.fn(),
}));

jest.mock('../../../src/common/logger');

const storageMock = {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
};

const statisticsStorageMock = {
    init: jest.fn(),
    addTraffic: jest.fn(),
    startDuration: jest.fn(),
    updateDuration: jest.fn(),
    endDuration: jest.fn(),
    getStatistics: jest.fn(),
    clearStatistics: jest.fn(),
};

const timersMock = {
    setInterval: jest.fn(),
    clearInterval: jest.fn(),
};

const credentialsMock = {
    isPremiumToken: jest.fn().mockResolvedValue(false),
};

const addSpecifiedListenerSpy = jest.spyOn(notifier, 'addSpecifiedListener');

const DEFAULT_EMITTER = {
    trafficStatsUpdated: async (data: any): Promise<void> => {
        throw new Error(`Emitter not received callback: ${JSON.stringify(data)}`);
    },
    currentLocationUpdated: async (data: any): Promise<void> => {
        throw new Error(`Emitter not received callback: ${JSON.stringify(data)}`);
    },
    tokenPremiumStateUpdated: async (data: any): Promise<void> => {
        throw new Error(`Emitter not received callback: ${JSON.stringify(data)}`);
    },
    connectivityStateChanged: async (data: any): Promise<void> => {
        throw new Error(`Emitter not received callback: ${JSON.stringify(data)}`);
    },
    tickTimer: async (): Promise<void> => {
        throw new Error('Emitter not received callback');
    },
};

describe('StatisticsProvider', () => {
    let emitter = {
        ...DEFAULT_EMITTER,
    };

    addSpecifiedListenerSpy.mockImplementation((events, callback) => {
        emitter.trafficStatsUpdated = async (data: any) => {
            await callback(notifier.types.TRAFFIC_STATS_UPDATED, data);
        };
        emitter.currentLocationUpdated = async (data: any) => {
            await callback(notifier.types.CURRENT_LOCATION_UPDATED, data);
        };
        emitter.tokenPremiumStateUpdated = async (data: any) => {
            await callback(notifier.types.TOKEN_PREMIUM_STATE_UPDATED, data);
        };
        emitter.connectivityStateChanged = async (data: any) => {
            await callback(notifier.types.CONNECTIVITY_STATE_CHANGED, data);
        };

        return 'listenerId';
    });

    timersMock.setInterval.mockImplementation((callback) => {
        emitter.tickTimer = async () => {
            await callback();
        };

        return 1;
    });

    let statisticsProvider: StatisticsProvider;
    beforeEach(async () => {
        statisticsProvider = new StatisticsProvider({
            storage: storageMock,
            statisticsStorage: statisticsStorageMock,
            // @ts-expect-error - partially implemented
            timers: timersMock,
            // @ts-expect-error - partially implemented
            credentials: credentialsMock,
        });

        await statisticsProvider.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
        emitter = {
            ...DEFAULT_EMITTER,
        };
    });

    /**
     * Simulates a user.
     *
     * @param isPremiumToken Whether the user has a premium token.
     */
    const simulateUser = async (isPremiumToken: boolean) => {
        await emitter.tokenPremiumStateUpdated(isPremiumToken);
    };

    /**
     * Simulates a location selection.
     *
     * @param locationId The ID of the location.
     */
    const simulateLocationSelection = async (locationId: string) => {
        await emitter.currentLocationUpdated({ id: locationId });
    };

    /**
     * Simulates a traffic stats update.
     *
     * @param bytesDownloaded Bytes downloaded.
     * @param bytesUploaded Bytes uploaded.
     */
    const simulateTrafficUpdate = async (bytesDownloaded: number, bytesUploaded: number) => {
        await emitter.trafficStatsUpdated({
            bytesDownloaded,
            bytesUploaded,
        });
    };

    /**
     * Simulates a connection to a location.
     */
    const simulateConnect = async () => {
        await emitter.connectivityStateChanged({ value: ConnectivityStateType.Connected });
    };

    /**
     * Simulates a disconnection from a location.
     */
    const simulateDisconnect = async () => {
        await emitter.connectivityStateChanged({ value: ConnectivityStateType.Idle });
    };

    /**
     * Advances the timer to trigger the event callback.
     */
    const advanceTimer = async () => {
        await emitter.tickTimer();
    };

    it('should initialize properly', async () => {
        // should attach listeners
        expect(addSpecifiedListenerSpy).toHaveBeenCalledTimes(1);
        expect(addSpecifiedListenerSpy).toHaveBeenCalledWith(
            [
                notifier.types.TRAFFIC_STATS_UPDATED,
                notifier.types.CURRENT_LOCATION_UPDATED,
                notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
                notifier.types.CONNECTIVITY_STATE_CHANGED,
            ],
            expect.any(Function),
        );
    });

    describe('Traffic statistics collection', () => {
        it('should save traffic stats to storage - user is premium', async () => {
            const locationId = 'location-id-1';
            const downloadedBytes = 11111;
            const uploadedBytes = 22222;

            await simulateUser(true);
            await simulateLocationSelection(locationId);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.addTraffic).toHaveBeenCalledWith(locationId, {
                downloadedBytes,
                uploadedBytes,
            });
        });

        it('should not save traffic stats to storage - user is not premium', async () => {
            const locationId = 'location-id-2';
            const downloadedBytes = 22222;
            const uploadedBytes = 33333;

            await simulateUser(false);
            await simulateLocationSelection(locationId);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).not.toHaveBeenCalled();
        });

        it('should not save traffic stats to storage - location is not selected', async () => {
            const downloadedBytes = 44444;
            const uploadedBytes = 55555;

            await simulateUser(true);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).not.toHaveBeenCalled();
        });

        it('should not save traffic stats to storage - stats collection disabled', async () => {
            const locationId = 'location-id-1';
            const downloadedBytes = 11111;
            const uploadedBytes = 22222;

            await statisticsProvider.setIsDisabled(true);
            await simulateUser(true);
            await simulateLocationSelection(locationId);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).not.toHaveBeenCalled();
        });

        it('should continue collecting after re-authentication to premium account', async () => {
            const locationId = 'location-id-5';
            const downloadedBytes = 55555;
            const uploadedBytes = 66666;

            await simulateUser(false);
            await simulateLocationSelection(locationId);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            await simulateUser(true);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.addTraffic).toHaveBeenCalledWith(locationId, {
                downloadedBytes,
                uploadedBytes,
            });
        });
    });

    describe('Duration statistics collection', () => {
        it('should save duration stats to storage - user is premium', async () => {
            const locationId = 'location-id-1';

            await simulateUser(true);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.startDuration).toHaveBeenCalledWith(locationId);

            await simulateDisconnect();

            expect(statisticsStorageMock.endDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.endDuration).toHaveBeenCalledWith(locationId);
        });

        it('should not save duration stats to storage - user is not premium', async () => {
            const locationId = 'location-id-2';

            await simulateUser(false);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).not.toHaveBeenCalled();

            await simulateDisconnect();

            expect(statisticsStorageMock.endDuration).not.toHaveBeenCalled();
        });

        it('should not save duration stats to storage - location is not selected', async () => {
            await simulateUser(false);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).not.toHaveBeenCalled();

            await simulateDisconnect();

            expect(statisticsStorageMock.endDuration).not.toHaveBeenCalled();
        });

        it('should save duration stats to storage - stats collection disabled', async () => {
            const locationId = 'location-id-1';

            await statisticsProvider.setIsDisabled(true);
            await simulateUser(true);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).not.toHaveBeenCalled();

            await simulateDisconnect();

            expect(statisticsStorageMock.endDuration).not.toHaveBeenCalled();
        });

        it('should continue collecting after re-authentication to premium account', async () => {
            const locationId = 'location-id-5';

            await simulateUser(false);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            await simulateUser(true);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.startDuration).toHaveBeenCalledWith(locationId);
        });

        it('should correctly start duration interval process', async () => {
            const locationId = 'location-id-6';

            await simulateUser(true);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            // should start duration interval
            expect(timersMock.setInterval).toHaveBeenCalledTimes(1);

            await advanceTimer();

            // should update duration stats
            expect(statisticsStorageMock.updateDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.updateDuration).toHaveBeenCalledWith(locationId);

            await simulateDisconnect();

            // should clear duration interval
            expect(timersMock.clearInterval).toHaveBeenCalledTimes(1);
        });

        it('should correctly end duration interval process if stats disabled when already connected', async () => {
            const locationId = 'location-id-7';

            await simulateUser(true);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            // should start duration interval
            expect(timersMock.setInterval).toHaveBeenCalledTimes(1);

            // should start duration stats
            expect(statisticsStorageMock.startDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.startDuration).toHaveBeenCalledWith(locationId);

            await advanceTimer();

            // should update duration stats
            expect(statisticsStorageMock.updateDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.updateDuration).toHaveBeenCalledWith(locationId);

            await statisticsProvider.setIsDisabled(true);

            // should clear duration interval
            expect(timersMock.clearInterval).toHaveBeenCalledTimes(1);

            // should end duration stats
            expect(statisticsStorageMock.endDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.endDuration).toHaveBeenCalledWith(locationId);
        });

        it('should correctly restart duration interval process if stats enabled when already connected', async () => {
            const locationId = 'location-id-8';

            await statisticsProvider.setIsDisabled(true);
            await simulateUser(true);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            // should not start duration interval
            expect(timersMock.setInterval).not.toHaveBeenCalled();

            // should not start duration stats
            expect(statisticsStorageMock.startDuration).not.toHaveBeenCalled();

            await expect(advanceTimer).rejects.toThrowError();

            // should not update duration stats
            expect(statisticsStorageMock.updateDuration).not.toHaveBeenCalled();

            await statisticsProvider.setIsDisabled(false);

            // should start duration interval
            expect(timersMock.setInterval).toHaveBeenCalledTimes(1);

            // should start duration stats
            expect(statisticsStorageMock.startDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.startDuration).toHaveBeenCalledWith(locationId);
        });
    });
});
