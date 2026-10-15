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
import { log } from '../../../src/common/logger';

const {
    storageSessionGetMock,
    storageSessionSetMock,
    storageSessionRemoveMock,
    tabsGetMock,
} = vi.hoisted(() => ({
    storageSessionGetMock: vi.fn().mockResolvedValue({}),
    storageSessionSetMock: vi.fn().mockResolvedValue(undefined),
    storageSessionRemoveMock: vi.fn().mockResolvedValue(undefined),
    tabsGetMock: vi.fn().mockResolvedValue({}),
}));

vi.mock('webextension-polyfill', () => {
    const createEventMock = () => ({
        addListener: vi.fn(),
        hasListener: vi.fn(),
        removeListener: vi.fn(),
    });

    return {
        default: {
            tabs: {
                get: tabsGetMock,
                onRemoved: createEventMock(),
                onReplaced: createEventMock(),
                onAttached: createEventMock(),
            },
            webRequest: {
                onBeforeRequest: createEventMock(),
                onErrorOccurred: createEventMock(),
            },
            storage: {
                session: {
                    get: storageSessionGetMock,
                    set: storageSessionSetMock,
                    remove: storageSessionRemoveMock,
                },
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
const WEB_AUTH_FLOW_STORAGE_KEY = 'webAuthFlowState';
const OAUTH_REDIRECT_URL = 'https://extension-login.adguard.io/';
const TAB_CLOSE_RETRY_DELAY_MS = 500;
const TAB_CLOSE_RETRY_TIMEOUT_MS = 30 * 1000;

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

    const createWebAuth = (): WebAuth => new WebAuth({
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

    beforeEach(() => {
        storageSessionGetMock.mockResolvedValue({});
        tabsGetMock.mockResolvedValue({ ...MOCK_TAB_INFO });
        webAuth = createWebAuth();
    });

    afterEach(() => {
        vi.clearAllMocks();
        browserSpy.clearEventListeners();
    });

    /**
     * Starts the web authentication flow and returns the final redirect URL
     * built from the flow's state and redirect URI.
     *
     * @param isSameState Whether the final URL should carry the flow's state.
     * @param isNewUser Whether the final URL should mark the user as new.
     * @param expiresIn Access token expiration in seconds.
     *
     * @returns Final redirect URL.
     */
    const startFlow = async (
        isSameState: boolean,
        isNewUser: boolean,
        expiresIn = MOCK_EXPIRES_IN,
    ): Promise<string> => {
        let savedWebAuthUrl: string | undefined;
        tabsMock.openTab.mockImplementationOnce(async (url) => {
            savedWebAuthUrl = url;
            return MOCK_TAB_INFO;
        });

        await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

        if (!savedWebAuthUrl) {
            throw new Error('Web auth URL was not saved');
        }

        // Extract state and redirect URI passed from service
        const { searchParams } = new URL(savedWebAuthUrl);
        const state = searchParams.get('state');
        const redirectUri = searchParams.get('redirect_uri');
        if (!state || !redirectUri) {
            throw new Error('Missing state or redirect URI');
        }

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

    describe('Starting the flow', () => {
        it('should start properly', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Auth cache flags should be updated
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Loading);

            // Should retrieve fallback auth API url once in `startWebAuthFlow`
            expect(fallbackApiMock.getAuthApiUrl).toHaveBeenCalledTimes(1);

            // Should open a new tab with correct URL
            expect(tabsMock.openTab).toHaveBeenCalledTimes(1);
            expect(tabsMock.openTab).toHaveBeenCalledWith(expect.stringContaining(MOCK_AUTH_API_URL));

            // Should save flow state to the session storage
            expect(storageSessionSetMock).toHaveBeenCalledWith({
                webAuthFlowState: {
                    authState: expect.any(String),
                    tabId: MOCK_TAB_INFO.id,
                },
            });

            // Should register event listeners once on the service worker start and never remove them
            expect(browserSpy.webRequest.onBeforeRequest.addListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.webRequest.onBeforeRequest.addListener).toHaveBeenCalledWith(expect.any(Function), {
                urls: [expect.any(String)],
                types: ['main_frame'],
            });
            expect(browserSpy.webRequest.onErrorOccurred.addListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.webRequest.onErrorOccurred.addListener).toHaveBeenCalledWith(expect.any(Function), {
                urls: ['<all_urls>'],
                types: ['main_frame'],
            });
            expect(browserSpy.tabs.onRemoved.addListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.tabs.onRemoved.addListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.tabs.onReplaced.addListener).toHaveBeenCalledTimes(1);
            expect(browserSpy.tabs.onReplaced.addListener).toHaveBeenCalledWith(expect.any(Function));
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledTimes(0);
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

            // Should not keep the flow id for a flow that never started
            // @ts-expect-error - accessing private property for test purposes
            expect(webAuth.flowId).toBeNull();
        });

        it('should handle unexpected errors gracefully', async () => {
            tabsMock.openTab.mockRejectedValueOnce(new Error('Unexpected error'));

            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Should try to open a tab once
            expect(tabsMock.openTab).toHaveBeenCalledTimes(1);

            // Should not close any tab, because none was opened
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(0);

            // Should show error state
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Failed);
        });

        it('should not open a tab if the flow was cancelled while checking the auth status', async () => {
            let resolveIsAuthenticated: () => void = () => {};
            authMock.isAuthenticated.mockReturnValueOnce(new Promise<void>((resolve) => {
                resolveIsAuthenticated = resolve;
            }));

            const startPromise = webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Let the start reach the pending auth status check
            await vi.waitFor(() => {
                expect(authMock.isAuthenticated).toHaveBeenCalledTimes(1);
            });

            // The user cancels while the auth status is still being checked
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);

            resolveIsAuthenticated();
            await startPromise;

            // Should not open a tab for the cancelled flow
            expect(tabsMock.openTab).toHaveBeenCalledTimes(0);
        });

        it('should not open a tab if the flow was cancelled while resolving the auth API URL', async () => {
            let resolveAuthApiUrl: (authApiUrl: string) => void = () => {};
            fallbackApiMock.getAuthApiUrl.mockReturnValueOnce(new Promise((resolve) => {
                resolveAuthApiUrl = resolve;
            }));

            const startPromise = webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Let the start reach the pending auth API URL resolution
            await vi.waitFor(() => {
                expect(fallbackApiMock.getAuthApiUrl).toHaveBeenCalledTimes(1);
            });

            // The user cancels while the auth API URL is still resolving
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);

            resolveAuthApiUrl(MOCK_AUTH_API_URL);
            await startPromise;

            // Should not open a tab for the cancelled flow
            expect(tabsMock.openTab).toHaveBeenCalledTimes(0);

            // Should not persist the cancelled flow
            expect(storageSessionSetMock).toHaveBeenCalledTimes(0);
        });

        it('should not open a tab when the start was superseded while resolving the auth API URL', async () => {
            let resolveAuthApiUrl: (authApiUrl: string) => void = () => {};
            fallbackApiMock.getAuthApiUrl.mockReturnValueOnce(new Promise((resolve) => {
                resolveAuthApiUrl = resolve;
            }));

            const startPromise = webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Let the start reach the pending auth API URL resolution
            await vi.waitFor(() => {
                expect(fallbackApiMock.getAuthApiUrl).toHaveBeenCalledTimes(1);
            });

            // The user cancels and starts a new flow while the first start is still resolving the auth API URL
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            resolveAuthApiUrl(MOCK_AUTH_API_URL);
            await startPromise;

            // Should open a tab only for the new flow
            expect(tabsMock.openTab).toHaveBeenCalledTimes(1);

            // Should persist only the new flow's state
            expect(storageSessionSetMock).toHaveBeenCalledTimes(1);
        });

        it('should close the tab opened by a superseded start', async () => {
            const strayTab = { id: 2, windowId: 1 } as Tabs.Tab;

            let resolveOpenTab: (tab: Tabs.Tab) => void = () => {};
            tabsMock.openTab.mockReturnValueOnce(new Promise((resolve) => {
                resolveOpenTab = resolve;
            }));

            const startPromise = webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Let the start reach the pending tab opening
            await vi.waitFor(() => {
                expect(tabsMock.openTab).toHaveBeenCalledTimes(1);
            });

            // The user cancels and starts a new flow while the first tab is still opening
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // The superseded start's tab opens after the new flow has already started
            resolveOpenTab(strayTab);
            await startPromise;

            // Should close the stray tab opened by the superseded start
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(1);
            expect(tabsMock.closeTab).toHaveBeenCalledWith(strayTab.id);
        });

        it('should not fail a new flow when a superseded start fails to open a tab', async () => {
            let rejectOpenTab: (error: Error) => void = () => {};
            tabsMock.openTab.mockReturnValueOnce(new Promise((_resolve, reject) => {
                rejectOpenTab = reject;
            }));

            const startPromise = webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // Let the start reach the pending tab opening
            await vi.waitFor(() => {
                expect(tabsMock.openTab).toHaveBeenCalledTimes(1);
            });

            // The user cancels and starts a new flow while the first tab is still opening
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // The superseded start's tab opening rejects
            rejectOpenTab(new Error('Unexpected error'));
            await startPromise;

            // Should not fail the new flow
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );

            // Should not close the new flow's tab
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(0);
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

            // Should not remove event listeners - they are registered once on the service worker start
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledTimes(0);
            // Should remove flow state from the session storage
            expect(storageSessionRemoveMock).toHaveBeenCalledWith(WEB_AUTH_FLOW_STORAGE_KEY);
        });

        it('should clear the stored flow before closing the tab on cancel', async () => {
            vi.useFakeTimers();

            try {
                // Make closing the tab slow, so the cancel flow gets stuck in the close retry loop
                tabsMock.closeTab.mockRejectedValue(new Error('Tabs cannot be edited right now (user may be dragging a tab).'));

                await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

                const cancelPromise = webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);

                // Advance timers to run several close retries while the tab is being dragged
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS * 3);

                // User releases the tab, so the next close attempt succeeds
                tabsMock.closeTab.mockResolvedValue(undefined);
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS);

                await cancelPromise;

                // The stored flow must be cleared before the first close attempt,
                // otherwise a new flow started during the retries loses its persisted state
                expect(storageSessionRemoveMock.mock.invocationCallOrder[0])
                    .toBeLessThan(tabsMock.closeTab.mock.invocationCallOrder[0]);
            } finally {
                tabsMock.closeTab.mockReset();
                vi.useRealTimers();
            }
        });

        it('should ignore if flow is not started', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);

            // Should update cache anyways
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Idle);

            // Should not close tab - nothing to close
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(0);

            // Should not remove event listeners - they are registered once on the service worker start
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledTimes(0);
        });
    });

    describe('Finishing the flow', () => {
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

            // Should not remove event listeners - they are registered once on the service worker start
            expect(browserSpy.webRequest.onBeforeRequest.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.webRequest.onErrorOccurred.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.tabs.onRemoved.removeListener).toHaveBeenCalledTimes(0);
            expect(browserSpy.tabs.onReplaced.removeListener).toHaveBeenCalledTimes(0);
            // Should remove flow state from the session storage
            expect(storageSessionRemoveMock).toHaveBeenCalledWith(WEB_AUTH_FLOW_STORAGE_KEY);

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

        it('should clear the stored flow before closing the tab on error', async () => {
            vi.useFakeTimers();

            try {
                // Make closing the tab slow, so the error handling gets stuck in the close retry loop
                tabsMock.closeTab.mockRejectedValue(new Error('Tabs cannot be edited right now (user may be dragging a tab).'));

                await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

                // The error arrives while the tab is still open, so showErrorState has to close it
                const errorPromise = browserSpy.webRequest.onErrorOccurred.emitEvent({
                    error: 'net::ERR_FAILED',
                    tabId: MOCK_TAB_INFO.id,
                    url: 'https://auth.adguard.com/some/route',
                });

                // Advance timers to run several close retries while the tab is being dragged
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS * 3);

                // User releases the tab, so the next close attempt succeeds
                tabsMock.closeTab.mockResolvedValue(undefined);
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS);

                await errorPromise;

                // The stored flow must be cleared before the first close attempt,
                // otherwise a new flow started during the retries loses its persisted state
                expect(storageSessionRemoveMock.mock.invocationCallOrder[0])
                    .toBeLessThan(tabsMock.closeTab.mock.invocationCallOrder[0]);
            } finally {
                tabsMock.closeTab.mockReset();
                vi.useRealTimers();
            }
        });

        it('should retry closing the tab when it cannot be closed because of dragging', async () => {
            tabsMock.closeTab
                .mockRejectedValueOnce(new Error('Tabs cannot be edited right now (user may be dragging a tab).'))
                .mockResolvedValueOnce(undefined);

            const finalUrl = await startFlow(true, false);
            await finishFlow(finalUrl);

            // Should close tab after a retry
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(2);

            // Should authenticate with token
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
        });

        it('should keep closing the tab after a drag longer than the old retry budget', async () => {
            vi.useFakeTimers();

            try {
                // Closing always fails while the user is dragging the tab
                tabsMock.closeTab.mockRejectedValue(new Error('Tabs cannot be edited right now (user may be dragging a tab).'));

                const finalUrl = await startFlow(true, false);

                const finishPromise = finishFlow(finalUrl);

                // The drag lasts longer than the old 8-attempt budget (~4s), so the close
                // loop must keep polling past it to close the tab when the drag ends
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS * 12);

                const closeCallsBeforeRelease = tabsMock.closeTab.mock.calls.length;

                // User releases the tab, so the next close attempt succeeds
                tabsMock.closeTab.mockResolvedValue(undefined);
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS);

                await finishPromise;

                // Should have tried to close the tab again after the release, i.e. the
                // 30-second close window kept running past the old 8-attempt budget
                expect(tabsMock.closeTab.mock.calls.length).toBeGreaterThan(closeCallsBeforeRelease);

                // Should authenticate with token
                expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
            } finally {
                tabsMock.closeTab.mockReset();
                vi.useRealTimers();
            }
        });

        it('should stop closing the tab when it disappears during the retries', async () => {
            vi.useFakeTimers();

            try {
                tabsMock.closeTab.mockRejectedValue(new Error('Tabs cannot be edited right now (user may be dragging a tab).'));

                const finalUrl = await startFlow(true, false);

                const finishPromise = finishFlow(finalUrl);

                // The drag is ongoing
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS * 2);

                // The tab is closed mid-drag (e.g. by the user), so it no longer exists
                tabsGetMock.mockRejectedValue(new Error(`No tab with id: ${MOCK_TAB_INFO.id}`));

                const closeCallsBefore = tabsMock.closeTab.mock.calls.length;
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS * 3);

                await finishPromise;

                // Should not keep trying to close a tab that no longer exists
                expect(tabsMock.closeTab.mock.calls.length).toBe(closeCallsBefore);

                // Should not log an error for a tab that was closed normally
                expect(log.error).not.toHaveBeenCalledWith(expect.stringContaining('closeWebAuthTabWithRetry'));
            } finally {
                tabsMock.closeTab.mockReset();
                vi.useRealTimers();
            }
        });

        it('should ignore the redirect if the flow was cancelled while checking auth status', async () => {
            let resolveIsAuthenticated: () => void = () => {};
            authMock.isAuthenticated
                .mockResolvedValueOnce(false)
                .mockReturnValueOnce(new Promise<void>((resolve) => {
                    resolveIsAuthenticated = resolve;
                }));

            const finalUrl = await startFlow(true, false);

            const finishPromise = finishFlow(finalUrl);

            // Wait until the second `isAuthenticated` call has started, so the cancel lands
            // while `finishWebAuthFlow` is waiting on it: the tab is already closed and the
            // post-close check has passed, so only the re-check after the await can stop
            // the token write
            await vi.waitFor(() => {
                expect(authMock.isAuthenticated).toHaveBeenCalledTimes(2);
            });

            // Cancel the flow while finish is waiting on the second isAuthenticated call
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);

            resolveIsAuthenticated();

            await finishPromise;

            // Should not authenticate, because the flow is no longer active
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(0);
        });

        it('should process a redirect from a new flow while the previous flow is still finishing', async () => {
            let resolveSetAccessToken: () => void = () => {};
            authMock.setAccessToken.mockReturnValueOnce(new Promise<void>((resolve) => {
                resolveSetAccessToken = resolve;
            }));

            const finalUrlA = await startFlow(true, false);

            // Flow A hangs while authenticating; its authState is already cleared
            const finishPromiseA = finishFlow(finalUrlA);

            // Wait until flow A has cleared its authState and is hanging in setAccessToken,
            // so the new flow can actually start while A is still finishing
            await vi.waitFor(() => {
                expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
            });

            // Start flow B and finish it while flow A is still authenticating
            const finalUrlB = await startFlow(true, false);
            const finishPromiseB = finishFlow(finalUrlB);

            resolveSetAccessToken();

            await Promise.all([finishPromiseA, finishPromiseB]);

            // Should authenticate both flows: the finish guard is keyed per flow
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(2);
        });

        it('should not fail a new flow when the previous token write rejects', async () => {
            let rejectSetAccessToken: (error: Error) => void = () => {};
            authMock.setAccessToken.mockReturnValueOnce(new Promise<void>((resolve, reject) => {
                rejectSetAccessToken = reject;
            }));

            const finalUrlA = await startFlow(true, false);
            const finishPromiseA = finishFlow(finalUrlA);

            await vi.waitFor(() => {
                expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
            });

            const finalUrlB = await startFlow(true, false);

            rejectSetAccessToken(new Error('Failed to store access token'));
            await finishPromiseA;

            expect(tabsMock.closeTab).toHaveBeenCalledTimes(1);
            expect(storageSessionRemoveMock).toHaveBeenCalledTimes(1);
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );

            await finishFlow(finalUrlB);

            expect(authMock.setAccessToken).toHaveBeenCalledTimes(2);
        });

        it('should authenticate anyway when the tab cannot be closed', async () => {
            vi.useFakeTimers();

            try {
                tabsMock.closeTab.mockRejectedValue(new Error('Tabs cannot be edited right now (user may be dragging a tab).'));

                const finalUrl = await startFlow(true, false);

                const finishPromise = finishFlow(finalUrl);

                // Exhaust the whole close retry window while the tab is being dragged
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_TIMEOUT_MS + TAB_CLOSE_RETRY_DELAY_MS);

                await finishPromise;

                // Should have kept retrying to close the tab while it was being dragged
                expect(tabsMock.closeTab.mock.calls.length).toBeGreaterThan(1);

                // Should authenticate with token anyway
                expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
            } finally {
                tabsMock.closeTab.mockReset();
                vi.useRealTimers();
            }
        });

        it('should not process a duplicate redirect while the flow is being finished', async () => {
            vi.useFakeTimers();

            try {
                // Make closing the tab slow, so the flow stays in the close retry loop
                tabsMock.closeTab.mockRejectedValue(new Error('Tabs cannot be edited right now (user may be dragging a tab).'));

                const finalUrl = await startFlow(true, false);

                // Start finishing the flow; it gets stuck in the close retry loop
                const finishPromise = finishFlow(finalUrl);

                // Emit a duplicate redirect while the first finish is still in progress
                await browserSpy.webRequest.onBeforeRequest.emitEvent({ tabId: MOCK_TAB_INFO.id, url: finalUrl });

                // Advance timers to run several close retries while the drag is ongoing
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS * 3);

                // User releases the tab, so the next close attempt succeeds
                tabsMock.closeTab.mockResolvedValue(undefined);
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS);

                await finishPromise;

                // Should authenticate only once
                expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
                expect(flagsStorageMock.onAuthenticate).toHaveBeenCalledTimes(1);
            } finally {
                tabsMock.closeTab.mockReset();
                vi.useRealTimers();
            }
        });
    });

    describe('In between start-finish events', () => {
        it('should intercept redirect after tab was torn off into another window', async () => {
            const finalUrl = await startFlow(true, false);

            // No window handling is needed after a tear-off: the redirect is matched by
            // the tab id and the state, both of which survive moving the tab to another window.
            await browserSpy.webRequest.onBeforeRequest.emitEvent({ tabId: MOCK_TAB_INFO.id, url: finalUrl });

            // Wait for the async redirect handling to finish
            await new Promise((resolve) => { setTimeout(resolve, 0); });

            // Should authenticate with token, because the redirect is matched by state, not window ID
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
        });

        it('should ignore redirects with non-matching state', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.webRequest.onBeforeRequest.emitEvent({
                tabId: MOCK_TAB_INFO.id,
                url: `${OAUTH_REDIRECT_URL}#access_token=some-token&state=some-other-state`,
            });

            // Wait for the async redirect handling to finish
            await new Promise((resolve) => { setTimeout(resolve, 0); });

            // Should not authenticate and should not surface an error,
            // because the state mismatch is caught by the guard before the flow is touched
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(0);
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );
        });

        it('should ignore redirects from other tabs even with matching state', async () => {
            const finalUrl = await startFlow(true, false);

            await browserSpy.webRequest.onBeforeRequest.emitEvent({ tabId: 999, url: finalUrl });

            // Wait for the async redirect handling to finish
            await new Promise((resolve) => { setTimeout(resolve, 0); });

            // Should not authenticate, because the redirect must come from the web authentication tab
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(0);
        });

        it('should not fail if flow was cancelled while redirect was being processed', async () => {
            const finalUrl = await startFlow(true, false);

            // Emit the redirect and cancel the flow while it is being processed (fire-and-forget)
            await browserSpy.webRequest.onBeforeRequest.emitEvent({ tabId: MOCK_TAB_INFO.id, url: finalUrl });
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);

            // Wait for the async redirect handling to finish
            await new Promise((resolve) => { setTimeout(resolve, 0); });

            // Should not show error state, because cancelling the flow is not an error
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );
        });

        it('should show error state if tab gets closed', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.tabs.onRemoved.emitEvent(MOCK_TAB_INFO.id);

            // Should show error state
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.FailedByUser,
            );
        });

        it('should not try to close the tab if it was already removed', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // User closes the auth tab manually
            await browserSpy.tabs.onRemoved.emitEvent(MOCK_TAB_INFO.id);

            // Cancel the flow afterwards
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);

            // Should not try to close the already removed tab
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(0);
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

        it('should focus the current window on reopen after the tab was moved', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // The tab was moved into another window; the window ID is read from the tab at reopen
            tabsGetMock.mockResolvedValue({ ...MOCK_TAB_INFO, windowId: 2 });

            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Reopen);

            // Should focus on the current window, not the stale one
            expect(windowsApiMock.update).toHaveBeenCalledWith(2, { focused: true });
        });

        it('should show error state if web request error occurs', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.webRequest.onErrorOccurred.emitEvent({
                error: 'net::ERR_FAILED',
                tabId: MOCK_TAB_INFO.id,
                url: 'https://auth.adguard.com/some/route',
            });

            // Should show error state
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );
        });

        it('should not fail a new flow that starts while the previous flow is closing its tab', async () => {
            vi.useFakeTimers();

            try {
                // Make closing the tab slow, so the error handling stays in the close retry loop
                tabsMock.closeTab.mockRejectedValue(new Error('Tabs cannot be edited right now (user may be dragging a tab).'));

                await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

                // The error arrives while the tab is still open; showErrorState gets stuck in the close loop
                const errorPromise = browserSpy.webRequest.onErrorOccurred.emitEvent({
                    error: 'net::ERR_FAILED',
                    tabId: MOCK_TAB_INFO.id,
                    url: 'https://auth.adguard.com/some/route',
                });

                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS * 3);

                // The user starts a new flow while the old one is still closing; keep it
                // blocked inside `isAuthenticated`, i.e. before the new authState is assigned
                let resolveIsAuthenticated: () => void = () => {};
                authMock.isAuthenticated.mockReturnValueOnce(new Promise<void>((resolve) => {
                    resolveIsAuthenticated = resolve;
                }));
                const startNewFlowPromise = webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

                // The new flow has already assigned its flow id, but not its authState yet.
                // Releasing the old tab must not fail the new flow.
                tabsMock.closeTab.mockResolvedValue(undefined);
                await vi.advanceTimersByTimeAsync(TAB_CLOSE_RETRY_DELAY_MS);

                await errorPromise;

                // Should not show error state, because a new flow was started
                expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                    AuthCacheKey.WebAuthFlowState,
                    WebAuthState.Failed,
                );

                // Let the new flow finish starting
                resolveIsAuthenticated();
                await startNewFlowPromise;
            } finally {
                tabsMock.closeTab.mockReset();
                vi.useRealTimers();
            }
        });

        it('should not fail a new flow when a stale error handler resumes after the user restarted', async () => {
            // The worker was woken by the restored flow; its auth host is still resolving
            let resolveAuthApiUrl: (authApiUrl: string) => void = () => {};
            fallbackApiMock.getAuthApiUrl.mockReturnValueOnce(new Promise((resolve) => {
                resolveAuthApiUrl = resolve;
            }));
            storageSessionGetMock.mockResolvedValueOnce({
                webAuthFlowState: {
                    authState: 'stored-state',
                    tabId: MOCK_TAB_INFO.id,
                },
            });
            tabsGetMock.mockResolvedValueOnce({ ...MOCK_TAB_INFO });

            const restoredWebAuth = createWebAuth();
            await restoredWebAuth.waitForInit();

            // The error in the auth tab arrives while the auth host is still resolving
            const errorPromise = browserSpy.webRequest.onErrorOccurred.emitEvent({
                error: 'net::ERR_FAILED',
                tabId: MOCK_TAB_INFO.id,
                url: 'https://auth.adguard.com/some/route',
            });

            // Let the handler pass the tab check and reach the pending auth host resolution
            await new Promise((resolve) => { setTimeout(resolve, 0); });

            // The user cancels the restored flow and starts a new one while the handler is waiting
            await restoredWebAuth.handleAction(MOCK_APP_ID, WebAuthAction.Cancel);
            await restoredWebAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            // The auth host resolves; the stale handler resumes and must not fail the new flow
            resolveAuthApiUrl(MOCK_AUTH_API_URL);
            await errorPromise;

            // Should not fail the new flow and should not close its tab
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );
            expect(tabsMock.closeTab).toHaveBeenCalledTimes(1);
        });

        it('should not show error state when the auth host is not resolved', async () => {
            // A restored flow whose auth host could not be resolved must not have
            // unrelated errors in the auth tab close it and show the failure modal
            storageSessionGetMock.mockResolvedValueOnce({
                webAuthFlowState: {
                    authState: 'stored-state',
                    tabId: MOCK_TAB_INFO.id,
                },
            });
            tabsGetMock.mockResolvedValueOnce({
                id: MOCK_TAB_INFO.id,
                windowId: 1,
                url: 'https://auth.adguard.com/oauth/authorize?state=stored-state',
            });
            fallbackApiMock.getAuthApiUrl.mockRejectedValueOnce(new Error('Network error'));

            createWebAuth();

            await browserSpy.webRequest.onErrorOccurred.emitEvent({
                error: 'net::ERR_FAILED',
                tabId: MOCK_TAB_INFO.id,
                url: 'https://auth.adguard.com/some/route',
            });

            // Should not show error state or log an error from the handler:
            // without the guard, `new URL(null)` throws inside the handler and the
            // try/catch would log the error while producing the same visible outcome
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );
            expect(log.error).not.toHaveBeenCalledWith(
                '[vpn.WebAuth.handleOnErrorOccurred]: Error occurred while handling web request error:',
                expect.anything(),
            );
        });

        it('should ignore web request errors from unrelated URLs', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.webRequest.onErrorOccurred.emitEvent({
                error: 'net::ERR_FAILED',
                tabId: MOCK_TAB_INFO.id,
                url: 'https://example.com/some/route',
            });

            // Should not show error state
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );
        });

        it('should ignore web request errors from other tabs', async () => {
            await webAuth.handleAction(MOCK_APP_ID, WebAuthAction.Start);

            await browserSpy.webRequest.onErrorOccurred.emitEvent({
                error: 'net::ERR_FAILED',
                tabId: 999,
                url: 'https://auth.adguard.com/some/route',
            });

            // Should not show error state
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Failed,
            );
        });

        it('should restore flow state after service worker restart', async () => {
            storageSessionGetMock.mockResolvedValueOnce({
                webAuthFlowState: {
                    authState: 'stored-state',
                    tabId: MOCK_TAB_INFO.id,
                },
            });

            // The tab is alive and still on the auth page; its window ID is read from the tab
            tabsGetMock.mockResolvedValue({
                id: MOCK_TAB_INFO.id,
                windowId: 2,
                url: 'https://auth.adguard.com/oauth/authorize?state=stored-state',
            });

            const restoredWebAuth = createWebAuth();
            await restoredWebAuth.handleAction(MOCK_APP_ID, WebAuthAction.Reopen);

            // Should restore flow state machine
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Loading);

            // Should focus on the window from the tab
            expect(windowsApiMock.update).toHaveBeenCalledWith(2, { focused: true });
            expect(tabsMock.focusTab).toHaveBeenCalledWith(MOCK_TAB_INFO.id);
        });

        it('should not block flow restoration while resolving the auth API URL', async () => {
            let resolveAuthApiUrl: (authApiUrl: string) => void = () => {};
            fallbackApiMock.getAuthApiUrl.mockReturnValueOnce(new Promise((resolve) => {
                resolveAuthApiUrl = resolve;
            }));
            storageSessionGetMock.mockResolvedValueOnce({
                webAuthFlowState: {
                    authState: 'stored-state',
                    tabId: MOCK_TAB_INFO.id,
                },
            });
            tabsGetMock.mockResolvedValueOnce({ ...MOCK_TAB_INFO });

            const restoredWebAuth = createWebAuth();

            try {
                await restoredWebAuth.waitForInit();
                expect(authCacheMock.updateCache).toHaveBeenCalledWith(
                    AuthCacheKey.WebAuthFlowState,
                    WebAuthState.Loading,
                );
            } finally {
                resolveAuthApiUrl(MOCK_AUTH_API_URL);
            }
        });

        it('should complete an old flow when its redirect wakes the service worker', async () => {
            storageSessionGetMock.mockResolvedValueOnce({
                webAuthFlowState: {
                    authState: 'stored-state',
                    tabId: MOCK_TAB_INFO.id,
                },
            });
            tabsGetMock.mockResolvedValueOnce({ ...MOCK_TAB_INFO });

            createWebAuth();

            const finalUrl = `${OAUTH_REDIRECT_URL}#${qs.stringify({
                access_token: MOCK_ACCESS_TOKEN,
                expires_in: MOCK_EXPIRES_IN,
                token_type: TOKEN_TYPE,
                state: 'stored-state',
            })}`;
            await browserSpy.webRequest.onBeforeRequest.emitEvent({ tabId: MOCK_TAB_INFO.id, url: finalUrl });
            await new Promise((resolve) => { setTimeout(resolve, 0); });

            expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
        });

        it('should clear unreadable flow state instead of keeping it forever', async () => {
            storageSessionGetMock.mockResolvedValueOnce({
                webAuthFlowState: {
                    authState: 123,
                    tabId: 'not-a-number',
                },
            });

            const restoredWebAuth = createWebAuth();
            await restoredWebAuth.handleAction(MOCK_APP_ID, WebAuthAction.Reopen);

            // Should remove the unreadable flow state from the session storage
            expect(storageSessionRemoveMock).toHaveBeenCalledWith(WEB_AUTH_FLOW_STORAGE_KEY);

            // Should not restore the flow state machine
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Loading,
            );
        });

        it('should complete login after restoration on an intermediate social page', async () => {
            storageSessionGetMock.mockResolvedValueOnce({
                webAuthFlowState: {
                    authState: 'stored-state',
                    tabId: MOCK_TAB_INFO.id,
                },
            });
            // The user is on a social login page, which doesn't contain the OAuth path
            tabsGetMock.mockResolvedValueOnce({
                id: MOCK_TAB_INFO.id,
                windowId: 2,
                url: 'https://accounts.google.com/o/oauth2/authorize',
            });

            const restoredWebAuth = createWebAuth();
            await restoredWebAuth.handleAction(MOCK_APP_ID, WebAuthAction.Reopen);

            // Should restore flow state machine
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Loading);

            // User finishes the social login; the final redirect arrives after the restore
            const finalUrl = `${OAUTH_REDIRECT_URL}#${qs.stringify({
                access_token: MOCK_ACCESS_TOKEN,
                expires_in: MOCK_EXPIRES_IN,
                token_type: TOKEN_TYPE,
                state: 'stored-state',
            })}`;
            await browserSpy.webRequest.onBeforeRequest.emitEvent({ tabId: MOCK_TAB_INFO.id, url: finalUrl });
            await new Promise((resolve) => { setTimeout(resolve, 0); });

            // Should complete login despite the intermediate social page
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
        });

        it('should complete login after restoration on the final redirect URL', async () => {
            storageSessionGetMock.mockResolvedValueOnce({
                webAuthFlowState: {
                    authState: 'stored-state',
                    tabId: MOCK_TAB_INFO.id,
                },
            });
            // The tab is already on the fictional redirect URL
            tabsGetMock.mockResolvedValueOnce({
                id: MOCK_TAB_INFO.id,
                windowId: 2,
                url: `${OAUTH_REDIRECT_URL}#access_token=some-token&state=stored-state`,
            });

            const restoredWebAuth = createWebAuth();
            await restoredWebAuth.handleAction(MOCK_APP_ID, WebAuthAction.Reopen);

            // Should restore flow state machine
            expect(authCacheMock.updateCache).toHaveBeenCalledWith(AuthCacheKey.WebAuthFlowState, WebAuthState.Loading);

            // The user reloads the redirect URL; the redirect is caught and login completes
            const finalUrl = `${OAUTH_REDIRECT_URL}#${qs.stringify({
                access_token: MOCK_ACCESS_TOKEN,
                expires_in: MOCK_EXPIRES_IN,
                token_type: TOKEN_TYPE,
                state: 'stored-state',
            })}`;
            await browserSpy.webRequest.onBeforeRequest.emitEvent({ tabId: MOCK_TAB_INFO.id, url: finalUrl });
            await new Promise((resolve) => { setTimeout(resolve, 0); });

            // Should complete login even though the restored page was the redirect URL
            expect(authMock.setAccessToken).toHaveBeenCalledTimes(1);
        });

        it('should clear stale flow state if tab was closed while service worker was dead', async () => {
            storageSessionGetMock.mockResolvedValueOnce({
                webAuthFlowState: {
                    authState: 'stored-state',
                    tabId: 999,
                },
            });
            tabsGetMock.mockRejectedValueOnce(new Error('No tab with id: 999'));

            const restoredWebAuth = createWebAuth();
            await restoredWebAuth.handleAction(MOCK_APP_ID, WebAuthAction.Reopen);

            // Should remove stale flow state from the session storage
            expect(storageSessionRemoveMock).toHaveBeenCalledWith(WEB_AUTH_FLOW_STORAGE_KEY);

            // Should not restore the flow state machine
            expect(authCacheMock.updateCache).not.toHaveBeenCalledWith(
                AuthCacheKey.WebAuthFlowState,
                WebAuthState.Loading,
            );
        });
    });
});
