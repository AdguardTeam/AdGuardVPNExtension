import { ConnectivityEventType } from '../../src/background/connectivity/connectivityService';
import { RateModal, RateModalStatus } from '../../src/background/rateModal/RateModal';
import { ConnectivityStateType } from '../../src/background/schema';

const mockStorage = {
    get: jest.fn().mockResolvedValue({
        connections: 0,
        status: RateModalStatus.Initial,
    }),
    set: jest.fn(),
};

const mockSettings = {
    getSetting: jest.fn().mockReturnValue(true),
};

const mockNotifier = {
    addSpecifiedListener: jest.fn().mockReturnValue('some-random-id'),
    removeListener: jest.fn(),
    notifyListeners: jest.fn(),
    types: {
        SETTING_UPDATED: 'event.setting.updated',
        SHOW_RATE_MODAL: 'event.rateModal.show',
    },
};

describe('RateModal', () => {
    let rateModal: RateModal;

    beforeEach(() => {
        rateModal = new RateModal({
            // @ts-ignore - partially mocked
            storage: mockStorage,
            // @ts-ignore - partially mocked
            settings: mockSettings,
            // @ts-ignore - partially mocked
            notifier: mockNotifier,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('RateModal.initState', () => {
        it('should read state from local storage and attach listener', async () => {
            await rateModal.initState();

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(0);
            expect(mockNotifier.addSpecifiedListener).toHaveBeenCalledTimes(1);
        });

        it('should save state if not found in local storage', async () => {
            mockStorage.get.mockResolvedValueOnce(undefined);

            await rateModal.initState();

            expect(mockStorage.get).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
        });

        it('should not attach listener if flow is finished', async () => {
            mockStorage.get.mockResolvedValueOnce({
                connections: 0,
                status: RateModalStatus.Finished,
            });

            await rateModal.initState();

            expect(mockNotifier.addSpecifiedListener).not.toHaveBeenCalled();
        });

        it('should not attach listener if show rate setting is disabled', async () => {
            mockSettings.getSetting.mockReturnValueOnce(false);

            await rateModal.initState();

            expect(mockNotifier.addSpecifiedListener).not.toHaveBeenCalled();
        });
    });

    describe('RateModal.handleConnectivityStateChange', () => {
        it('should not trigger state update if connectivity status is not "connected"', async () => {
            let savedListener!: (state: any) => void;
            mockNotifier.addSpecifiedListener.mockImplementationOnce((_, listener) => {
                savedListener = listener;
                return 'some-random-id';
            });

            await rateModal.initState();

            // Simulate event emit
            savedListener({
                value: ConnectivityStateType.Idle,
                event: 'any-event',
            });
            savedListener({
                value: ConnectivityStateType.ConnectingIdle,
                event: ConnectivityEventType.ExtensionLaunched,
            });
            savedListener({
                value: ConnectivityStateType.ConnectingRetrying,
                event: 'any-event',
            });
            savedListener({
                value: ConnectivityStateType.DisconnectedIdle,
                event: 'any-event',
            });
            savedListener({
                value: ConnectivityStateType.DisconnectedRetrying,
                event: 'any-event',
            });

            // It should not update state
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should not trigger state update and should remove listener if setting is disabled', async () => {
            let savedListener!: (state: any) => void;
            mockNotifier.addSpecifiedListener.mockImplementationOnce((_, listener) => {
                savedListener = listener;
                return 'some-random-id';
            });

            await rateModal.initState();

            // Simulate setting change
            mockSettings.getSetting.mockReturnValueOnce(false);

            // Simulate event emit
            savedListener({
                value: ConnectivityStateType.Connected,
                event: ConnectivityEventType.ConnectionSuccess,
            });

            // It should not update state
            expect(mockStorage.set).not.toHaveBeenCalled();
            expect(mockNotifier.removeListener).toHaveBeenCalledTimes(1);
            expect(mockNotifier.removeListener).toHaveBeenCalledWith('some-random-id');
        });

        it('should not trigger state update if connected is not caused by pressing btn', async () => {
            let savedListener!: (state: any) => void;
            mockNotifier.addSpecifiedListener.mockImplementationOnce((_, listener) => {
                savedListener = listener;
                return 'some-random-id';
            });

            await rateModal.initState();

            // Simulate event emit
            savedListener({
                value: ConnectivityStateType.ConnectingIdle,
                event: ConnectivityEventType.ExtensionLaunched,
            });
            savedListener({
                value: ConnectivityStateType.Connected,
                event: ConnectivityEventType.ConnectionSuccess,
            });

            // It should update state
            expect(mockStorage.set).not.toHaveBeenCalled();
            expect(mockNotifier.removeListener).not.toHaveBeenCalled();
        });

        it('should update state', async () => {
            let savedListener!: (state: any) => void;
            mockNotifier.addSpecifiedListener.mockImplementationOnce((_, listener) => {
                savedListener = listener;
                return 'some-random-id';
            });

            await rateModal.initState();

            // Simulate event emit
            savedListener({
                value: ConnectivityStateType.ConnectingIdle,
                event: ConnectivityEventType.ConnectBtnPressed,
            });
            savedListener({
                value: ConnectivityStateType.Connected,
                event: ConnectivityEventType.ConnectionSuccess,
            });

            // It should update state
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(
                expect.any(String),
                {
                    connections: 1,
                    status: RateModalStatus.Initial,
                },
            );
        });

        it('should emit event to open modal', async () => {
            let savedListener!: (state: any) => void;
            mockNotifier.addSpecifiedListener.mockImplementationOnce((_, listener) => {
                savedListener = listener;
                return 'some-random-id';
            });

            mockStorage.get.mockResolvedValueOnce({
                connections: 2,
                status: RateModalStatus.Initial,
            });

            await rateModal.initState();

            // Simulate event emit
            savedListener({
                value: ConnectivityStateType.ConnectingIdle,
                event: ConnectivityEventType.ConnectBtnPressed,
            });
            savedListener({
                value: ConnectivityStateType.Connected,
                event: ConnectivityEventType.ConnectionSuccess,
            });

            // It should update state
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(
                expect.any(String),
                {
                    connections: 3,
                    status: RateModalStatus.Initial,
                },
            );
        });
    });

    describe('RateModal.shouldShowRateModal', () => {
        it('should return "false" if setting is disabled', async () => {
            await rateModal.initState();

            mockSettings.getSetting.mockReturnValueOnce(false);

            const shouldShow = rateModal.shouldShowRateModal();
            expect(shouldShow).toBe(false);
        });

        it('should return "false" if flow is finished', async () => {
            mockStorage.get.mockResolvedValueOnce({
                connections: 0,
                status: RateModalStatus.Finished,
            });

            await rateModal.initState();

            const shouldShow = rateModal.shouldShowRateModal();
            expect(shouldShow).toBe(false);
        });

        it('should return "false" if initial and less than 3 connections', async () => {
            mockStorage.get.mockResolvedValueOnce({
                connections: 2,
                status: RateModalStatus.Initial,
            });

            await rateModal.initState();

            const shouldShow = rateModal.shouldShowRateModal();
            expect(shouldShow).toBe(false);
        });

        it('should return "true" if initial and equal or more than 3 connections', async () => {
            mockStorage.get.mockResolvedValueOnce({
                connections: 3,
                status: RateModalStatus.Initial,
            });

            await rateModal.initState();

            const shouldShow = rateModal.shouldShowRateModal();
            expect(shouldShow).toBe(true);
        });

        it('should return "false" if hidden and less than 30 connections', async () => {
            mockStorage.get.mockResolvedValueOnce({
                connections: 29,
                status: RateModalStatus.Hidden,
            });

            await rateModal.initState();

            const shouldShow = rateModal.shouldShowRateModal();
            expect(shouldShow).toBe(false);
        });

        it('should return "true" if hidden and equal or more than 30 connections', async () => {
            mockStorage.get.mockResolvedValueOnce({
                connections: 30,
                status: RateModalStatus.Initial,
            });

            await rateModal.initState();

            const shouldShow = rateModal.shouldShowRateModal();
            expect(shouldShow).toBe(true);
        });
    });

    describe('RateModal.hideAfterRate', () => {
        it('should not update state if flow is finished', async () => {
            mockStorage.get.mockResolvedValueOnce({
                connections: 0,
                status: RateModalStatus.Finished,
            });

            await rateModal.initState();
            await rateModal.hideAfterRate();

            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should update state to "finished" and remove listener', async () => {
            await rateModal.initState();
            await rateModal.hideAfterRate();

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(
                expect.any(String),
                {
                    connections: 0,
                    status: RateModalStatus.Finished,
                },
            );
            expect(mockNotifier.removeListener).toHaveBeenCalledTimes(1);
        });
    });

    describe('RateModal.hideAfterCancel', () => {
        it('should not update state if flow is finished', async () => {
            mockStorage.get.mockResolvedValueOnce({
                connections: 0,
                status: RateModalStatus.Finished,
            });

            await rateModal.initState();
            await rateModal.hideAfterCancel();

            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should update state to "hidden" if it was "initial"', async () => {
            await rateModal.initState();
            await rateModal.hideAfterCancel();

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(
                expect.any(String),
                {
                    connections: 0,
                    status: RateModalStatus.Hidden,
                },
            );
        });

        it('should update state to "finished" if it was "hidden"', async () => {
            mockStorage.get.mockResolvedValueOnce({
                connections: 0,
                status: RateModalStatus.Hidden,
            });

            await rateModal.initState();
            await rateModal.hideAfterCancel();

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(
                expect.any(String),
                {
                    connections: 0,
                    status: RateModalStatus.Finished,
                },
            );
        });
    });
});
