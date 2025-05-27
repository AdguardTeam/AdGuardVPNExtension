import { ConnectivityStateType } from '../../../src/background/schema';
import { STATISTICS_STATE_DEFAULTS } from '../../../src/background/schema/statistics';
import { StatisticsProvider } from '../../../src/background/statistics/StatisticsProvider';
import { notifier } from '../../../src/common/notifier';

jest.mock('../../../src/common/notifier', () => ({
    ...jest.requireActual('../../../src/common/notifier'),
    addSpecifiedListener: jest.fn(),
}));

jest.mock('../../../src/common/logger');

const stateStorageMock = {
    getItem: jest.fn().mockImplementation(() => ({
        ...STATISTICS_STATE_DEFAULTS,
    })),
    setItem: jest.fn(),
};

const statisticsStorageMock = {
    init: jest.fn(),
    addAccount: jest.fn(),
    addTraffic: jest.fn(),
    startDuration: jest.fn(),
    updateDuration: jest.fn(),
    endDuration: jest.fn(),
    getAccountStatistics: jest.fn(),
    clearAccountStatistics: jest.fn(),
};

const credentialsMock = {
    getUsername: jest.fn().mockResolvedValue('test@adguard.com'),
};

const timersMock = {
    setInterval: jest.fn(),
    clearInterval: jest.fn(),
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
    userAuthenticated: async (): Promise<void> => {
        throw new Error('Emitter not received callback');
    },
    userDeauthenticated: async (): Promise<void> => {
        throw new Error('Emitter not received callback');
    },
    tickTimer: async (): Promise<void> => {
        throw new Error('Emitter not received callback');
    },
};

describe('StatisticsProvider', () => {
    let statisticsProvider: StatisticsProvider;
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
        emitter.userAuthenticated = async () => {
            await callback(notifier.types.USER_AUTHENTICATED);
        };
        emitter.userDeauthenticated = async () => {
            await callback(notifier.types.USER_DEAUTHENTICATED);
        };

        return 'listenerId';
    });

    timersMock.setInterval.mockImplementation((callback) => {
        emitter.tickTimer = async () => {
            await callback();
        };

        return 'timerId';
    });

    beforeEach(() => {
        statisticsProvider = new StatisticsProvider({
            // @ts-expect-error - partially implemented
            stateStorage: stateStorageMock,
            statisticsStorage: statisticsStorageMock,
            // @ts-expect-error - partially implemented
            credentials: credentialsMock,
            // @ts-expect-error - partially implemented
            timers: timersMock,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        emitter = DEFAULT_EMITTER;
    });

    /**
     * Simulates a user authentication.
     *
     * @param userId The ID of the user.
     * @param locationId The ID of the location.
     * @param isPremiumToken Whether the user has a premium token.
     */
    const simulateUserAuth = async (userId: string, isPremiumToken: boolean) => {
        credentialsMock.getUsername.mockResolvedValueOnce(userId);
        await emitter.userAuthenticated();
        await emitter.tokenPremiumStateUpdated(isPremiumToken);
    };

    /**
     * Simulates a user de-authentication.
     */
    const simulateUserDeauth = async () => {
        await emitter.userDeauthenticated();
        await emitter.tokenPremiumStateUpdated(false);
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

    describe('Initialization', () => {
        it('should initialize properly', async () => {
            await statisticsProvider.init();

            // should attach listeners
            expect(addSpecifiedListenerSpy).toHaveBeenCalledTimes(1);
            expect(addSpecifiedListenerSpy).toHaveBeenCalledWith(
                [
                    notifier.types.TRAFFIC_STATS_UPDATED,
                    notifier.types.CURRENT_LOCATION_UPDATED,
                    notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
                    notifier.types.CONNECTIVITY_STATE_CHANGED,
                    notifier.types.USER_AUTHENTICATED,
                    notifier.types.USER_DEAUTHENTICATED,
                ],
                expect.any(Function),
            );

            // should read state from session storage
            expect(stateStorageMock.getItem).toHaveBeenCalledTimes(1);
            expect(stateStorageMock.getItem).toHaveBeenCalledWith(expect.any(String));

            // statistics storage should be initialized
            expect(statisticsStorageMock.init).toHaveBeenCalledTimes(1);
        });

        it('should restore state from session storage', async () => {
            const state = {
                accountId: 'restored@adguard.com',
                locationId: 'restored-location',
                isPremiumToken: true,
                durationIntervalId: 1,
            };

            stateStorageMock.getItem.mockReturnValueOnce(state);

            await statisticsProvider.init();

            expect(stateStorageMock.getItem).toHaveBeenCalledTimes(1);
            // @ts-expect-error - accessing private property
            expect(statisticsProvider.state).toEqual(state);
        });
    });

    describe('Traffic statistics collection', () => {
        it('should save traffic stats to storage - user is premium', async () => {
            await statisticsProvider.init();

            const accountId = 'user-id-1@adguard.com';
            const locationId = 'location-id-1';
            const downloadedBytes = 11111;
            const uploadedBytes = 22222;

            await simulateUserAuth(accountId, true);
            await simulateLocationSelection(locationId);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.addTraffic).toHaveBeenCalledWith({
                accountId,
                locationId,
                downloadedBytes,
                uploadedBytes,
            });
        });

        it('should not save traffic stats to storage - user is not premium', async () => {
            await statisticsProvider.init();

            const accountId = 'user-id-2@adguard.com';
            const locationId = 'location-id-2';
            const downloadedBytes = 22222;
            const uploadedBytes = 33333;

            await simulateUserAuth(accountId, false);
            await simulateLocationSelection(locationId);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).not.toHaveBeenCalled();
        });

        it('should not save traffic stats to storage - user is not authenticated', async () => {
            await statisticsProvider.init();

            const locationId = 'location-id-3';
            const downloadedBytes = 33333;
            const uploadedBytes = 44444;

            await simulateLocationSelection(locationId);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).not.toHaveBeenCalled();
        });

        it('should not save traffic stats to storage - location is not selected', async () => {
            await statisticsProvider.init();

            const accountId = 'user-id-4@adguard.com';
            const downloadedBytes = 44444;
            const uploadedBytes = 55555;

            await simulateUserAuth(accountId, true);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).not.toHaveBeenCalled();
        });

        it('should continue collecting after re-authentication to premium account', async () => {
            await statisticsProvider.init();

            const accountId1 = 'user-id-5@adguard.com';
            const accountId2 = 'user-id-6@adguard.com';
            const locationId = 'location-id-5';
            const downloadedBytes = 55555;
            const uploadedBytes = 66666;

            await simulateUserAuth(accountId1, false);
            await simulateLocationSelection(locationId);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            await simulateUserDeauth();
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            await simulateUserAuth(accountId2, true);
            await simulateTrafficUpdate(downloadedBytes, uploadedBytes);

            expect(statisticsStorageMock.addTraffic).toHaveBeenCalledTimes(1);
        });
    });

    describe('Duration statistics collection', () => {
        it('should save duration stats to storage - user is premium', async () => {
            await statisticsProvider.init();

            const accountId = 'user-id-1@adguard.com';
            const locationId = 'location-id-1';

            await simulateUserAuth(accountId, true);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.startDuration).toHaveBeenCalledWith({
                accountId,
                locationId,
            });

            await simulateDisconnect();

            expect(statisticsStorageMock.endDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.endDuration).toHaveBeenCalledWith({
                accountId,
                locationId,
            });
        });

        it('should not save duration stats to storage - user is not premium', async () => {
            await statisticsProvider.init();

            const accountId = 'user-id-2@adguard.com';
            const locationId = 'location-id-2';

            await simulateUserAuth(accountId, false);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).not.toHaveBeenCalled();

            await simulateDisconnect();

            expect(statisticsStorageMock.endDuration).not.toHaveBeenCalled();
        });

        it('should not save duration stats to storage - user is not authenticated', async () => {
            await statisticsProvider.init();

            const locationId = 'location-id-3';

            await simulateLocationSelection(locationId);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).not.toHaveBeenCalled();

            await simulateDisconnect();

            expect(statisticsStorageMock.endDuration).not.toHaveBeenCalled();
        });

        it('should not save duration stats to storage - location is not selected', async () => {
            await statisticsProvider.init();

            const accountId = 'user-id-4@adguard.com';

            await simulateUserAuth(accountId, false);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).not.toHaveBeenCalled();

            await simulateDisconnect();

            expect(statisticsStorageMock.endDuration).not.toHaveBeenCalled();
        });

        it('should continue collecting after re-authentication to premium account', async () => {
            await statisticsProvider.init();

            const accountId1 = 'user-id-5@adguard.com';
            const accountId2 = 'user-id-6@adguard.com';
            const locationId = 'location-id-5';

            await simulateUserAuth(accountId1, false);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            await simulateUserDeauth();
            await simulateConnect();

            await simulateUserAuth(accountId2, true);
            await simulateConnect();

            expect(statisticsStorageMock.startDuration).toHaveBeenCalledTimes(1);
        });

        it('should correctly start duration interval process', async () => {
            await statisticsProvider.init();

            const accountId = 'user-id-7@adguard.com';
            const locationId = 'location-id-6';

            await simulateUserAuth(accountId, true);
            await simulateLocationSelection(locationId);
            await simulateConnect();

            // should start duration interval
            expect(timersMock.setInterval).toHaveBeenCalledTimes(1);

            await advanceTimer();

            // should update duration stats
            expect(statisticsStorageMock.updateDuration).toHaveBeenCalledTimes(1);
            expect(statisticsStorageMock.updateDuration).toHaveBeenCalledWith({
                accountId,
                locationId,
            });

            await simulateDisconnect();

            // should clear duration interval
            expect(timersMock.clearInterval).toHaveBeenCalledTimes(1);
        });
    });
});
