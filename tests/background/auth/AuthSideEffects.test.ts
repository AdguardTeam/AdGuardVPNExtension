import {
    vi,
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from 'vitest';

import { AuthSideEffects } from '../../../src/background/authSideEffects/AuthSideEffects';
import { translator } from '../../../src/common/translator';

vi.mock('../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn(),
    },
}));

vi.mock('../../../src/background/browserApi/runtime', () => ({
    getUrl: vi.fn().mockImplementation((path: string) => `chrome-extension://test${path}`),
}));

const MOCK_FORWARDER_DOMAIN = 'forwarder.adguard.com';
const MOCK_TRANSLATION_STRING = 'test-translation-string';

const notifierMock = {
    addSpecifiedListener: vi.fn(),
    types: {
        WEB_AUTH_FLOW_AUTHENTICATED: 'event.web.auth.flow.authenticated',
    },
};

const notificationsMock = {
    create: vi.fn(),
};

const updateServiceMock = {
    isFirstRun: true,
};

const forwarderMock = {
    updateAndGetDomain: vi.fn().mockResolvedValue(MOCK_FORWARDER_DOMAIN),
};

const tabsMock = {
    openTab: vi.fn(),
};

const endpointsServiceMock = {
    getLocationsFromServer: vi.fn(),
};

const translatorGetMessageSpy = vi.spyOn(translator, 'getMessage').mockReturnValue(MOCK_TRANSLATION_STRING);

describe('AuthSideEffects', () => {
    let authSideEffects: AuthSideEffects;

    beforeEach(() => {
        authSideEffects = new AuthSideEffects({
            // @ts-expect-error - partially implemented
            notifier: notifierMock,
            notifications: notificationsMock,
            // @ts-expect-error - partially implemented
            updateService: updateServiceMock,
            // @ts-expect-error - partially implemented
            forwarder: forwarderMock,
            // @ts-expect-error - partially implemented
            tabs: tabsMock,
            // @ts-expect-error - partially implemented
            endpoints: endpointsServiceMock,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        updateServiceMock.isFirstRun = true;
    });

    describe('Web auth flow authentication', () => {
        it('init - should properly attach listener', () => {
            // Init
            authSideEffects.init();

            // Should attach listener
            expect(notifierMock.addSpecifiedListener).toHaveBeenCalledTimes(1);
            expect(notifierMock.addSpecifiedListener).toHaveBeenCalledWith(
                notifierMock.types.WEB_AUTH_FLOW_AUTHENTICATED,
                expect.any(Function),
            );
        });

        it('should properly notify and open compare page on first run', async () => {
            // Save provided callback
            let savedCallback: () => Promise<void>;
            notifierMock.addSpecifiedListener.mockImplementationOnce((_, callback) => {
                savedCallback = callback;
            });

            // Init
            authSideEffects.init();

            // Callback should be passed
            expect(savedCallback!).toBeDefined();

            // Simulate event firing
            await savedCallback!();

            // Should translate
            expect(translatorGetMessageSpy).toHaveBeenCalledTimes(1);
            expect(translatorGetMessageSpy).toHaveBeenCalledWith(expect.any(String));

            // Should notify user
            expect(notificationsMock.create).toHaveBeenCalledTimes(1);
            expect(notificationsMock.create).toHaveBeenCalledWith({ message: MOCK_TRANSLATION_STRING });

            // Should update and get forwarder domain
            expect(forwarderMock.updateAndGetDomain).toHaveBeenCalledTimes(1);

            // Should open compare page
            expect(tabsMock.openTab).toHaveBeenCalledTimes(1);
            expect(tabsMock.openTab).toHaveBeenCalledWith(expect.stringContaining(MOCK_FORWARDER_DOMAIN));
        });

        it('should open success auth page on subsequent runs', async () => {
            // Simulate subsequent run
            updateServiceMock.isFirstRun = false;

            // Save provided callback
            let savedCallback: () => Promise<void>;
            notifierMock.addSpecifiedListener.mockImplementationOnce((_, callback) => {
                savedCallback = callback;
            });

            // Init
            authSideEffects.init();

            // Callback should be passed
            expect(savedCallback!).toBeDefined();

            // Simulate event firing
            await savedCallback!();

            // Should not notify user
            expect(notificationsMock.create).toHaveBeenCalledTimes(0);

            // Should not open compare page
            expect(tabsMock.openTab).toHaveBeenCalledTimes(1);
            expect(tabsMock.openTab).toHaveBeenCalledWith('chrome-extension://test/success-auth.html');
        });
    });
});
