import {
    vi,
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from 'vitest';
import browser, { type Tabs } from 'webextension-polyfill';
import qs from 'qs';

import { WebAuth } from '../../../src/background/auth/WebAuth';
import { AuthCacheKey } from '../../../src/background/authentication/authCacheTypes';
import { WebAuthAction, WebAuthState } from '../../../src/background/auth/webAuthEnums';

vi.mock('webextension-polyfill', () => {
    const createEventMock = () => ({
        addListener: vi.fn(),
        hasListener: vi.fn(),
        removeListener: vi.fn(),
    });

    return {
        default: {
            tabs: {
                onRemoved: createEventMock(),
                onReplaced: createEventMock(),
                onAttached: createEventMock(),
            },
            webRequest: {
                onBeforeRequest: createEventMock(),
                onErrorOccurred: createEventMock(),
            },
        },
    };
});

vi.mock('../../../src/common/logger', () => ({
    log: {
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

const MOCK_APP_ID = 'test-app-id';
const MOCK_AUTH_API_URL = 'auth.adguard.com';
const MOCK_TAB_INFO = { id: 1, windowId: 1 } as Tabs.Tab;
const MOCK_ACCESS_TOKEN = 'test-access-token';
const MOCK_EXPIRES_IN = 3600;
const MOCK_INCORRECT_STATE = 'some-incorrect-state';
const TOKEN_TYPE = 'bearer';
const SCOPE = 'trust';

const authMock = {
    isAuthenticated: vi.fn().mockResolvedValue(false),
    setAccessToken: vi.fn(),
};

const authCacheMock = {
    updateCache: vi.fn(),
    clearCache: vi.fn(),
};

const flagsStorageMock = {
    onRegister: vi.fn(),
    onAuthenticate: vi.fn(),
};

const fallbackApiMock = {
    getAuthApiUrl: vi.fn().mockResolvedValue(MOCK_AUTH_API_URL),
};

const notifierMock = {
    notifyListeners: vi.fn(),
    types: {
        WEB_AUTH_FLOW_AUTHENTICATED: 'event.web.auth.flow.authenticated',
    },
};

const tabsMock = {
    closeTab: vi.fn(),
    openTab: vi.fn().mockResolvedValue(MOCK_TAB_INFO),
    focusTab: vi.fn(),
};

const windowsApiMock = {
    update: vi.fn(),
};

const browserSpy = (() => {
    const eventClearFns: (() => void)[] = [];

    const mockEventImplementation = (base: any) => {
        const events: ((...args: unknown[]) => void)[] = [];

        eventClearFns.push(() => {
            events.length = 0;
        });

        return {
            addListener: vi.spyOn(base, 'addListener').mockImplementation((...args: unknown[]) => {
                const callback = args[0] as (...args: unknown[]) => void;
                events.push(callback);
            }),
            hasListener: vi.spyOn(base, 'hasListener').mockImplementation((...args: unknown[]) => {
                const callback = args[0] as (...args: unknown[]) => void;
                const includes = events.includes(callback);
                return includes;
            }),
            removeListener: vi.spyOn(base, 'removeListener').mockImplementation((...args: unknown[]) => {
                const callback = args[0] as (...args: unknown[]) => void;
                const index = events.indexOf(callback);
                events.splice(index, 1);
            }),
            emitEvent: async (...args: unknown[]) => {
                await Promise.all(events.map(async (cb) => cb(...args)));
            },
        };
    };

    return {
        tabs: {
            onRemoved: mockEventImplementation(browser.tabs.onRemoved),
            onReplaced: mockEventImplementation(browser.tabs.onReplaced),
            onAttached: mockEventImplementation(browser.tabs.onAttached),
        },
        webRequest: {
            onBeforeRequest: mockEventImplementation(browser.webRequest.onBeforeRequest),
            onErrorOccurred: mockEventImplementation(browser.webRequest.onErrorOccurred),
        },
        clearEventListeners: () => {
            eventClearFns.forEach((fn) => fn());
        },
    };
})();

describe('WebAuth', () => {
    let webAuth: WebAuth;

    beforeEach(() => {
        webAuth = new WebAuth({
            // @ts-expect-error - partially implemented
            auth: authMock,
            // @ts-expect-error - partially implemented
            authCache: authCacheMock,
            // @ts-expect-error - partially implemented
            flagsStorage: flagsStorageMock,
            // @ts-expect-error - partially implemented
            fallbackApi: fallbackApiMock,
            // @ts-expect-error - partially implemented
            notifier: notifierMock,
            // @ts-expect-error - partially implemented
            tabs: tabsMock,
            // @ts-expect-error - partially implemented
            windowsApi: windowsApiMock,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        browserSpy.clearEventListeners();
    });

    describe('Starting the flow', () => {
        it('should start properly', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Auth cache flags should be updated
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Loading);

            // Should retrieve fallback auth API url first
            expect(fallbackApiMock.getAuthApiUrl).toHaveBeenCalledTimes(1);

            // Should open a new tab with correct URL
            expect(tabsMock.openTab).toHaveBeenCalledTimes(1);
            expect(tabsMock.openTab).toHaveBeenCalledWith(expect.stringContaining(MOCK_AUTH_API_URL));

            // Should attach event listeners
            expect(browserSpy.webRequest.onBeforeRequest.addListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.webRequest.onBeforeRequest.addListener).toHaveBeenCalledWith(expect.any(Function), {
                urls: [expect.any(String)],
                types: ['main_frame'],
                tabId: MOCK_TAB_INFO.id,
                windowId: MOCK_TAB_INFO.windowId,
            });
            expect(browserSpy.webRequest.onErrorOccurred.addListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.webRequest.onErrorOccurred.addListener).toHaveBeenCalledWith(expect.any(Function), {
                urls: ['<all_urls>'],
                types: ['main_frame'],
                tabId: MOCK_TAB_INFO.id,
                windowId: MOCK_TAB_INFO.windowId,
            });
            expect(browserSpy.tabs.onRemoved.addListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.tabs.onRemoved.addListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onReplaced.addListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.tabs.onReplaced.addListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onAttached.addListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.tabs.onAttached.addListener).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should ignore multiple requests if there are ongoing flow', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // First one should successfully open
            expect(tabsMock.openTab).toHaveBeenCalledTimes(1);

            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // After first request it should not start any new flow
            expect(tabsMock.openTab).toHaveBeenCalledTimes(1);
        });

        it('should ignore if user already authenticated', async () => {
            authMock.isAuthenticated.mockResolvedValueOnce(true);
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Should not open any tab
            expect(tabsMock.openTab).toHaveBeenCalledTimes(0);
        });

        it('should handle unexpected errors gracefully', async () => {
            browserSpy.tabs.onAttached.addListener.mockImplementationOnce(() => {
                throw new Error('Unexpected error');
            });

            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Should open tab once, but because it's failed after opening it should close below
            expect(tabsMock.openTab).toHaveBeenCalledTimes(1);

            // Should close tab
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(1);
            expect(tabsMock.closeTab).toHaveBeenCalledWith(MOCK_TAB_INFO.id);

            // Should remove listeners twice - once for removal before adding, once after failing to add
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onAttached.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.tabs.onAttached.removeListener).toHaveBeenCalledWith(expect.any(Function));

            // Should show error state
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Failed);
        });
    });

    describe('Reopening the flow', () => {
        it('should reopen properly after starting', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Reopen);

            // Should focus on window
            expect(windowsApiMock.update).toHaveBeenCalledTimes(1);
            expect(windowsApiMock.update).toHaveBeenCalledWith(MOCK_TAB_INFO.windowId, { focused: true });

            // Should focus on opened tab
            expect(tabsMock.focusTab).toHaveBeenCalledTimes(1);
            expect(tabsMock.focusTab).toHaveBeenCalledWith(MOCK_TAB_INFO.id);
        });

        it('should ignore if flow is not started', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Reopen);

            // Should not focus on window - nothing to focus
            expect(windowsApiMock.update).toHaveBeenCalledTimes(0);

            // Should not focus on opened tab - nothing to focus
            expect(tabsMock.focusTab).toHaveBeenCalledTimes(0);
        });
    });

    describe('Canceling the flow', () => {
        it('should cancel properly after starting', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);

            // Should update cache
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Idle);

            // Should close tab
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(1);
            expect(tabsMock.closeTab).toHaveBeenCalledWith(MOCK_TAB_INFO.id);

            // Should remove listeners twice - once for removal before adding, once after failing to add
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onAttached.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.tabs.onAttached.removeListener).toHaveBeenCalledWith(expect.any(Function));
        });

        it('should ignore if flow is not started', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);

            // Should update cache anyways
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Idle);

            // Should not close tab - nothing to close
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(0);

            // Should remove listeners
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onAttached.removeListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.tabs.onAttached.removeListener).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe('Finishing the flow', () => {
        const startFlow = async (
            isSameState: boolean,
            isNewUser: boolean,
            expiresIn = MOCK_EXPIRES_IN,
        ) => {
            let savedWebAuthUrl: string | undefined;
            tabsMock.openTab.mockImplementationOnce(async (url) => {
                savedWebAuthUrl = url;
                return MOCK_TAB_INFO;
            });

            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Should open tab
            expect(savedWebAuthUrl).toBeDefined();

            // Extract state and redirect URI passed from service
            const { searchParams } = new URL(savedWebAuthUrl!);
            const state = searchParams.get('state')!;
            const redirectUri = searchParams.get('redirect_uri')!;

            // Build final URL
            const params = qs.stringify({
                access_token: MOCK_ACCESS_TOKEN,
                expires_in: expiresIn,
                token_type: TOKEN_TYPE,
                state: isSameState ? state : MOCK_INCORRECT_STATE,
                is_new_user: isNewUser,
            });
            return `${redirectUri}#${params}`;
        };

        const finishFlow = async (finalUrl: string) => {
            // We can emit `browser.webRequest.onBeforeRequest` here with final URL,
            // but it's sync and in testing we need to await finish function,
            // that's why we calling it directly. In production it should handle event
            // and then only call `webAuth.finishWebAuthFlow`
            // @ts-expect-error - accessing private method for test purposes
            await webAuth.finishWebAuthFlow(finalUrl);
        };

        it('should finish properly after starting', async () => {
            const finalUrl = await startFlow(true, false);
            await finishFlow(finalUrl);

            // Should close tab
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(1);
            expect(tabsMock.closeTab).toHaveBeenCalledWith(MOCK_TAB_INFO.id);

            // Should remove listeners
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onAttached.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.tabs.onAttached.removeListener).toHaveBeenCalledWith(expect.any(Function));

            // Should authenticate with token
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
            expect(authMock.setAccessToken).toHaveBeenCalledWith({
                accessToken: MOCK_ACCESS_TOKEN,
                expiresIn: MOCK_EXPIRES_IN,
                tokenType: TOKEN_TYPE,
                scope: SCOPE,
            });

            // Should update flags
            expect(flagsStorageMock.onAuthenticate).toHaveBeenCalledTimes(1);

            // Should clear cache
            expect(authCacheMock.clearCache).toHaveBeenCalledTimes(1);

            // Should notify listeners
            expect(notifierMock.notifyListeners).toHaveBeenCalledTimes(1);
            expect(notifierMock.notifyListeners).toHaveBeenCalledWith(notifierMock.types.WEB_AUTH_FLOW_AUTHENTICATED);
        });

        it('should ignore if user already authenticated', async () => {
            const finalUrl = await startFlow(true, false);

            authMock.isAuthenticated.mockResolvedValueOnce(true);

            await finishFlow(finalUrl);

            expect(authMock.setAccessToken).toHaveBeenCalledTimes(0);
        });

        it('should change register flags if new user', async () => {
            const finalUrl = await startFlow(true, true);
            await finishFlow(finalUrl);

            // Should update flags
            expect(flagsStorageMock.onRegister).toHaveBeenCalledTimes(1);
        });

        it('should fail if state not matches', async () => {
            const finalUrl = await startFlow(false, false);
            await finishFlow(finalUrl);

            // Should not set access token
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(0);
        });

        it('should validate params properly', async () => {
            const finalUrl = await startFlow(true, false, NaN);
            await finishFlow(finalUrl);

            // Should not set access token
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(0);
        });

        it('should handle unexpected errors gracefully', async () => {
            const finalUrl = await startFlow(true, false);

            authMock.setAccessToken.mockImplementationOnce(() => {
                throw new Error('Unexpected error');
            });

            await finishFlow(finalUrl);

            // Should show error state
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Failed);
        });
    });

    describe('In between start-finish events', () => {
        it('should show error state if tab gets closed', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.tabs.onRemoved.emitEvent(MOCK_TAB_INFO.id);

            // Should show error state
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.FailedByUser,
            );
        });

        it('should ignore if closed tab is not auth tab', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.tabs.onRemoved.emitEvent(2);

            // Should not show error state
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.FailedByUser,
            );
        });

        it('should show error state if tab gets replaced', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.tabs.onReplaced.emitEvent(2, MOCK_TAB_INFO.id);

            // Should show error state
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.FailedByUser,
            );
        });

        it('should ignore if replaced tab is not auth tab', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.tabs.onReplaced.emitEvent(3, 2);

            // Should not show error state
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.FailedByUser,
            );
        });

        it('should properly update window if tab is moved between windows', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            browserSpy.tabs.onAttached.emitEvent(MOCK_TAB_INFO.id, { newWindowId: 2 });

            // Should update web request listeners

            // Should remove listeners
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledWith(expect.any(Function));

            // Should add them back with new window ID
            expect(browserSpy.webRequest.onBeforeRequest.addListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onBeforeRequest.addListener).toHaveBeenCalledWith(expect.any(Function), {
                urls: [expect.any(String)],
                types: ['main_frame'],
                tabId: MOCK_TAB_INFO.id,
                windowId: 2,
            });
            expect(browserSpy.webRequest.onErrorOccurred.addListener).toHaveBeenCalledTimes(2);
            expect(browserSpy.webRequest.onErrorOccurred.addListener).toHaveBeenCalledWith(expect.any(Function), {
                urls: ['<all_urls>'],
                types: ['main_frame'],
                tabId: MOCK_TAB_INFO.id,
                windowId: 2,
            });

            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Reopen);

            // Should focus on correct window ID
            expect(windowsApiMock.update).toHaveBeenCalledWith(2, { focused: true });
        });

        it('should show error state if web request error occurs', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.webRequest.onErrorOccurred.emitEvent({
                error: 'net::ERR_FAILED',
                url: 'https://auth.adguard.com/some/route',
            });

            // Should show error state
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );
        });
    });
});
