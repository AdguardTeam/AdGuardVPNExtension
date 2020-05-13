import { NetworkConnectionObserver } from '../../src/background/networkConnectionObserver';
import notifier from '../../src/lib/notifier';
import settings from '../../src/background/settings/settings';
import permissionsChecker from '../../src/background/permissionsChecker';

jest.mock('../../src/lib/notifier');
jest.mock('../../src/background/settings/settings');
jest.mock('../../src/background/permissionsChecker');

describe('NetworkConnectionObserver', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('subscribes to notifier WEBSOCKET_CLOSED event and network online event', () => {
        jest.spyOn(window, 'addEventListener');

        const networkConnectionObserver = new NetworkConnectionObserver();
        expect(notifier.addSpecifiedListener).toBeCalledWith(
            notifier.types.WEBSOCKET_CLOSED,
            networkConnectionObserver.websocketCloseHandler
        );
        expect(window.addEventListener).toBeCalledWith('online', networkConnectionObserver.connectionHandler);
    });

    it('on close event disables proxy and handles shouldReconnectWebsocket correctly', async () => {
        const networkConnectionObserver = new NetworkConnectionObserver();
        jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(true);
        await networkConnectionObserver.websocketCloseHandler();
        expect(settings.disableProxy).toBeCalledTimes(1);
        expect(networkConnectionObserver.shouldReconnectWebsocket).toBeFalsy();

        jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false);
        await networkConnectionObserver.websocketCloseHandler();
        expect(networkConnectionObserver.shouldReconnectWebsocket).toBeTruthy();
    });

    it('connectionHandler checks permissions and enables proxy', async () => {
        // network online
        const networkConnectionObserver = new NetworkConnectionObserver();
        await networkConnectionObserver.connectionHandler();
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(1);
        expect(networkConnectionObserver.shouldReconnectWebsocket).toBeFalsy();
        expect(settings.enableProxy).toBeCalledTimes(0);

        // websocket closed
        jest.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false);
        await networkConnectionObserver.websocketCloseHandler();
        expect(networkConnectionObserver.shouldReconnectWebsocket).toBeTruthy();

        // network offline again
        await networkConnectionObserver.connectionHandler();
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(2);
        expect(networkConnectionObserver.shouldReconnectWebsocket).toBeFalsy();
        expect(settings.enableProxy).toBeCalledTimes(1);
    });
});
