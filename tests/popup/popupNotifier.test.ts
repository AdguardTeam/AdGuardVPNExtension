import {
    describe,
    it,
    expect,
    vi,
} from 'vitest';

import { type NotifierMessage } from '../../src/common/messenger';
import { notifier } from '../../src/common/notifier';
import { SETTINGS_IDS } from '../../src/common/constants';
import {
    handlePopupNotifierMessage,
    type PopupNotifierDeps,
    type PopupSend,
} from '../../src/popup/components/App/popupNotifier';
import { PopupEvent } from '../../src/popup/components/App/popupAppMachineEnums';

/**
 * Default no-op stubs for every store method the handler can call.
 */
const makeStores = (overrides: {
    vpnStore?: Record<string, ReturnType<typeof vi.fn>>;
    settingsStore?: Record<string, ReturnType<typeof vi.fn>>;
    telemetryStore?: Record<string, ReturnType<typeof vi.fn>>;
    authStore?: Record<string, ReturnType<typeof vi.fn>>;
    statsStore?: Record<string, ReturnType<typeof vi.fn>>;
    translationStore?: Record<string, ReturnType<typeof vi.fn>>;
} = {}): PopupNotifierDeps => ({
    vpnStore: {
        setVpnInfo: vi.fn(),
        setLocations: vi.fn(),
        updateLocationState: vi.fn(),
        setSelectedLocation: vi.fn(),
        requestIsPremiumToken: vi.fn().mockResolvedValue(undefined),
        setIsPremiumToken: vi.fn(),
        setTooManyDevicesConnected: vi.fn(),
        setMaxDevicesAllowed: vi.fn(),
        startSwitchingProfile: vi.fn(),
        handleProfileChanged: vi.fn(),
    },
    settingsStore: {
        setGlobalError: vi.fn(),
        setConnectivityState: vi.fn(),
        openServerErrorPopup: vi.fn(),
    },
    telemetryStore: {
        setIsHelpUsImproveEnabled: vi.fn(),
    },
    authStore: {
        setShouldShowRateModal: vi.fn(),
        handleAuthCacheUpdate: vi.fn(),
        setIsAuthenticated: vi.fn(),
    },
    statsStore: {
        updateStatistics: vi.fn().mockResolvedValue(undefined),
    },
    translationStore: {
        setLocalePreference: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
}) as unknown as PopupNotifierDeps;

const message = (type: string, data?: unknown, value?: unknown): NotifierMessage => ({
    type,
    data,
    value,
}) as NotifierMessage;

const makeSend = (): PopupSend & ReturnType<typeof vi.fn> => vi.fn() as unknown as PopupSend & ReturnType<typeof vi.fn>;

describe('handlePopupNotifierMessage', () => {
    it('routes VPN_INFO_UPDATED to vpnStore.setVpnInfo', async () => {
        const stores = makeStores();
        const send = makeSend();
        const data = { usedDownloadedBytes: 10 };

        await handlePopupNotifierMessage(message(notifier.types.VPN_INFO_UPDATED, data), stores, send);

        expect(stores.vpnStore.setVpnInfo).toHaveBeenCalledWith(data);
        expect(send).not.toHaveBeenCalled();
    });

    it('routes CURRENT_LOCATION_UPDATED to setSelectedLocation', async () => {
        const stores = makeStores();
        await handlePopupNotifierMessage(
            message(notifier.types.CURRENT_LOCATION_UPDATED, 'loc-1'),
            stores,
            makeSend(),
        );

        expect(stores.vpnStore.setSelectedLocation).toHaveBeenCalledWith('loc-1');
    });

    it('clears global error and re-checks premium token on PERMISSIONS_ERROR_UPDATE with null data', async () => {
        const stores = makeStores();
        await handlePopupNotifierMessage(
            message(notifier.types.PERMISSIONS_ERROR_UPDATE, null),
            stores,
            makeSend(),
        );

        expect(stores.settingsStore.setGlobalError).toHaveBeenCalledWith(null);
        expect(stores.vpnStore.requestIsPremiumToken).toHaveBeenCalled();
    });

    it('does not re-check premium token when PERMISSIONS_ERROR_UPDATE carries an error', async () => {
        const stores = makeStores();
        const error = { message: 'boom' };

        await handlePopupNotifierMessage(
            message(notifier.types.PERMISSIONS_ERROR_UPDATE, error),
            stores,
            makeSend(),
        );

        expect(stores.settingsStore.setGlobalError).toHaveBeenCalledWith(error);
        expect(stores.vpnStore.requestIsPremiumToken).not.toHaveBeenCalled();
    });

    it('opens the server error popup on SERVER_ERROR', async () => {
        const stores = makeStores();
        await handlePopupNotifierMessage(
            message(notifier.types.SERVER_ERROR),
            stores,
            makeSend(),
        );

        expect(stores.settingsStore.openServerErrorPopup).toHaveBeenCalled();
    });

    it('toggles help-us-improve flag only for that setting boolean', async () => {
        const stores = makeStores();
        await handlePopupNotifierMessage(
            message(notifier.types.SETTING_UPDATED, SETTINGS_IDS.HELP_US_IMPROVE, true),
            stores,
            makeSend(),
        );

        expect(stores.telemetryStore.setIsHelpUsImproveEnabled).toHaveBeenCalledWith(true);
    });

    it('ignores SETTING_UPDATED for other settings', async () => {
        const stores = makeStores();
        await handlePopupNotifierMessage(
            message(notifier.types.SETTING_UPDATED, 'some-other-setting', true),
            stores,
            makeSend(),
        );

        expect(stores.telemetryStore.setIsHelpUsImproveEnabled).not.toHaveBeenCalled();
    });

    it('routes USER_AUTHENTICATED to auth store and the machine', async () => {
        const stores = makeStores();
        const send = makeSend();

        await handlePopupNotifierMessage(message(notifier.types.USER_AUTHENTICATED), stores, send);

        expect(stores.authStore.setIsAuthenticated).toHaveBeenCalledWith(true);
        expect(send).toHaveBeenCalledWith(PopupEvent.UserAuthenticated);
    });

    it('routes USER_DEAUTHENTICATED to auth store and the machine', async () => {
        const stores = makeStores();
        const send = makeSend();

        await handlePopupNotifierMessage(
            message(notifier.types.USER_DEAUTHENTICATED),
            stores,
            send,
        );

        expect(stores.authStore.setIsAuthenticated).toHaveBeenCalledWith(false);
        expect(send).toHaveBeenCalledWith(PopupEvent.UserDeauthenticated);
    });

    it('awaits async store actions (STATS_UPDATED / LANGUAGE_CHANGED)', async () => {
        const stores = makeStores();
        await handlePopupNotifierMessage(
            message(notifier.types.STATS_UPDATED),
            stores,
            makeSend(),
        );
        expect(stores.statsStore.updateStatistics).toHaveBeenCalled();

        await handlePopupNotifierMessage(
            message(notifier.types.LANGUAGE_CHANGED, 'en'),
            stores,
            makeSend(),
        );
        expect(stores.translationStore.setLocalePreference).toHaveBeenCalledWith('en');
    });

    it('handles unknown message types without throwing', async () => {
        const stores = makeStores();
        await expect(
            handlePopupNotifierMessage(message('UNKNOWN_TYPE'), stores, makeSend()),
        ).resolves.toBeUndefined();
    });
});
