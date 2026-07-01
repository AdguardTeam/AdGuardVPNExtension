import {
    vi,
    describe,
    it,
    expect,
    beforeEach,
} from 'vitest';
import browser from 'webextension-polyfill';

import { contextMenu } from '../../src/background/contextMenu';
import { settings } from '../../src/background/settings';
import { NotifierType } from '../../src/common/notifier';

// Shared mutable state between the mocked modules and the tests.
// `vi.mock` factories are hoisted above `const` declarations, so the holders
// must be created via `vi.hoisted` so they are available when the factories run.
const { capturedListeners, clickHandlerRef } = vi.hoisted(() => ({
    capturedListeners: {} as Record<string, (...args: unknown[]) => void>,
    clickHandlerRef: {
        current: (() => {}) as (
            info: browser.Menus.OnClickData,
            tab?: browser.Tabs.Tab,
        ) => void,
    },
}));

vi.mock('webextension-polyfill', () => ({
    default: {
        contextMenus: {
            create: vi.fn((_props: browser.Menus.CreateCreatePropertiesType, cb?: () => void) => {
                if (cb) {
                    cb();
                }
            }),
            remove: vi.fn(async () => {}),
            onClicked: {
                addListener: vi.fn((
                    handler: (info: browser.Menus.OnClickData, tab?: browser.Tabs.Tab) => void,
                ) => {
                    clickHandlerRef.current = handler;
                }),
            },
        },
        runtime: {
            lastError: null as string | null,
        },
    },
}));

vi.mock('../../src/common/translator', () => ({
    translator: {
        getMessage: (key: string) => key,
    },
}));

vi.mock('../../src/common/notifier', async (importOriginal) => {
    const actual = await importOriginal() as { NotifierType: typeof NotifierType };
    return {
        ...actual,
        notifier: {
            types: actual.NotifierType,
            addSpecifiedListener: vi.fn((
                event: string,
                listener: (...args: unknown[]) => void,
            ) => {
                capturedListeners[event] = listener;
                return 'listener-id';
            }),
            addListener: vi.fn(),
            notifyListeners: vi.fn(),
        },
    };
});

vi.mock('../../src/common/tabs', () => ({
    tabs: {
        getCurrent: vi.fn(async () => ({ url: 'https://example.com' })),
    },
}));

vi.mock('../../src/common/logger', () => ({
    log: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../src/common/utils/string', () => ({
    isHttp: (url: string) => url.startsWith('http'),
}));

vi.mock('../../src/common/exclusionsConstants', () => ({
    ExclusionsMode: {
        Selective: 'selective',
        Regular: 'regular',
    },
}));

vi.mock('../../src/common/constants', () => ({
    SETTINGS_IDS: {
        DEBUG_MODE_ENABLED: 'debug.mode.enabled',
        CONTEXT_MENU_ENABLED: 'context.menu.enabled',
    },
}));

vi.mock('../../src/background/settings', () => ({
    settings: {
        isProxyEnabled: vi.fn(() => false),
        enableProxy: vi.fn(async () => {}),
        disableProxy: vi.fn(async () => {}),
        isContextMenuEnabled: vi.fn(() => true),
        isDebugModeEnabled: vi.fn(() => false),
        getSetting: vi.fn(() => false),
        setSetting: vi.fn(async () => true),
    },
}));

vi.mock('../../src/background/exclusions', () => ({
    exclusions: {
        isVpnEnabledByUrl: vi.fn(async () => true),
        enableVpnByUrl: vi.fn(async () => {}),
        disableVpnByUrl: vi.fn(async () => {}),
        isInverted: vi.fn(async () => false),
        setMode: vi.fn(async () => {}),
    },
}));

vi.mock('../../src/background/profiles', () => ({
    profilesService: {
        getActiveProfileId: vi.fn(() => 'default'),
    },
}));

vi.mock('../../src/background/actions', () => ({
    actions: {
        openExportLogsPage: vi.fn(async () => {}),
        setIconDisabled: vi.fn(async () => {}),
        clearBadgeText: vi.fn(async () => {}),
    },
}));

describe('contextMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('connect/disconnect click actions', () => {
        beforeEach(() => {
            contextMenu.init();
        });

        it('calls settings.enableProxy(true) when connect is clicked', async () => {
            await clickHandlerRef.current(
                { menuItemId: 'connect' } as browser.Menus.OnClickData,
                { url: 'https://example.com' } as browser.Tabs.Tab,
            );
            expect(settings.enableProxy).toHaveBeenCalledWith(true);
        });

        it('calls settings.disableProxy(true) when disconnect is clicked', async () => {
            await clickHandlerRef.current(
                { menuItemId: 'disconnect' } as browser.Menus.OnClickData,
                { url: 'https://example.com' } as browser.Tabs.Tab,
            );
            expect(settings.disableProxy).toHaveBeenCalledWith(true);
        });
    });

    describe('connect/disconnect menu items based on VPN state', () => {
        it('shows connect item when VPN is disabled on HTTP page', async () => {
            vi.mocked(settings.isProxyEnabled).mockReturnValue(false);
            contextMenu.init();

            const tabUpdatedListener = capturedListeners[NotifierType.TAB_UPDATED];
            expect(tabUpdatedListener).toBeDefined();
            tabUpdatedListener({ url: 'https://example.com' });

            // Wait for async operations to complete
            await vi.waitFor(() => {
                expect(browser.contextMenus.create).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'connect' }),
                    expect.any(Function),
                );
            });
        });

        it('shows disconnect item when VPN is enabled on HTTP page', async () => {
            vi.mocked(settings.isProxyEnabled).mockReturnValue(true);
            contextMenu.init();

            const tabUpdatedListener = capturedListeners[NotifierType.TAB_UPDATED];
            expect(tabUpdatedListener).toBeDefined();
            tabUpdatedListener({ url: 'https://example.com' });

            await vi.waitFor(() => {
                expect(browser.contextMenus.create).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'disconnect' }),
                    expect.any(Function),
                );
            });
        });

        it('does not show connect/disconnect on non-HTTP page', async () => {
            vi.mocked(settings.isProxyEnabled).mockReturnValue(false);
            contextMenu.init();

            const tabUpdatedListener = capturedListeners[NotifierType.TAB_UPDATED];
            expect(tabUpdatedListener).toBeDefined();
            tabUpdatedListener({ url: 'chrome://settings' });

            // Wait for the menu update to actually run (separator is always created)
            await vi.waitFor(() => {
                expect(browser.contextMenus.create).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'separator' }),
                    expect.any(Function),
                );
            });

            expect(browser.contextMenus.create).not.toHaveBeenCalledWith(
                expect.objectContaining({ id: 'connect' }),
                expect.any(Function),
            );
            expect(browser.contextMenus.create).not.toHaveBeenCalledWith(
                expect.objectContaining({ id: 'disconnect' }),
                expect.any(Function),
            );
        });
    });

    describe('CONNECTIVITY_STATE_CHANGED listener', () => {
        it('refreshes context menu when connectivity state changes', async () => {
            vi.mocked(settings.isProxyEnabled).mockReturnValue(false);
            contextMenu.init();

            const connectivityListener = capturedListeners[NotifierType.CONNECTIVITY_STATE_CHANGED];
            expect(connectivityListener).toBeDefined();
            connectivityListener();

            await vi.waitFor(() => {
                expect(browser.contextMenus.create).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'connect' }),
                    expect.any(Function),
                );
            });
        });

        it('swaps connect to disconnect on connectivity state change after VPN connects', async () => {
            vi.mocked(settings.isProxyEnabled).mockReturnValue(false);
            contextMenu.init();

            const connectivityListener = capturedListeners[NotifierType.CONNECTIVITY_STATE_CHANGED];
            expect(connectivityListener).toBeDefined();
            connectivityListener();

            await vi.waitFor(() => {
                expect(browser.contextMenus.create).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'connect' }),
                    expect.any(Function),
                );
            });

            vi.mocked(settings.isProxyEnabled).mockReturnValue(true);
            connectivityListener();

            await vi.waitFor(() => {
                expect(browser.contextMenus.create).toHaveBeenCalledWith(
                    expect.objectContaining({ id: 'disconnect' }),
                    expect.any(Function),
                );
            });
        });
    });
});
