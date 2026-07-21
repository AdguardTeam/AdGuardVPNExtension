import { useEffect } from 'react';

import { type NotifierMessage, messenger } from '../../../common/messenger';
import { notifier } from '../../../common/notifier';
import { log } from '../../../common/logger';
import { SETTINGS_IDS } from '../../../common/constants';
import type { RootStore } from '../../stores/RootStore';

import { type PopupAppEvent, PopupEvent } from './popupAppMachineEnums';

/**
 * Subtype of the root store exposing only the stores that notifier messages
 * mutate. Using `RootStore[...]` keeps the signatures in sync with the real
 * store classes without importing them (avoiding runtime cycles).
 */
export interface PopupNotifierDeps {
    vpnStore: RootStore['vpnStore'];
    settingsStore: RootStore['settingsStore'];
    telemetryStore: RootStore['telemetryStore'];
    authStore: RootStore['authStore'];
    statsStore: RootStore['statsStore'];
    translationStore: RootStore['translationStore'];
}

/**
 * Function that forwards events to the popup state machine.
 *
 * Typed against the full machine event union ({@link PopupAppEvent}) so the
 * abstraction reflects the real event model, not just the events the notifier
 * happens to send.
 */
export type PopupSend = (event: PopupAppEvent) => void;

/**
 * Notifier message types the popup subscribes to via a long-lived connection.
 */
export const POPUP_NOTIFIER_EVENTS = [
    notifier.types.VPN_INFO_UPDATED,
    notifier.types.LOCATIONS_UPDATED,
    notifier.types.LOCATION_STATE_UPDATED,
    notifier.types.CURRENT_LOCATION_UPDATED,
    notifier.types.PERMISSIONS_ERROR_UPDATE,
    notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
    notifier.types.CONNECTIVITY_STATE_CHANGED,
    notifier.types.TOO_MANY_DEVICES_CONNECTED,
    notifier.types.SERVER_ERROR,
    notifier.types.SETTING_UPDATED,
    notifier.types.SHOW_RATE_MODAL,
    notifier.types.STATS_UPDATED,
    notifier.types.AUTH_CACHE_UPDATED,
    notifier.types.LANGUAGE_CHANGED,
    notifier.types.USER_AUTHENTICATED,
    notifier.types.USER_DEAUTHENTICATED,
    notifier.types.PROFILE_SWITCH_IN_PROGRESS,
    notifier.types.ACTIVE_PROFILE_CHANGED,
];

/**
 * Handles a single notifier message by dispatching it to the relevant store
 * setters and the state machine.
 *
 * Extracted from {@link usePopupNotifier} so it can be unit-tested in isolation
 * without standing up the message-port connection.
 *
 * @param message The notifier message received from the background page.
 * @param stores The store dependencies the handler needs.
 * @param send Send function for the popup state machine.
 */
export const handlePopupNotifierMessage = async (
    message: NotifierMessage,
    stores: PopupNotifierDeps,
    send: PopupSend,
): Promise<void> => {
    const {
        vpnStore,
        settingsStore,
        telemetryStore,
        authStore,
        statsStore,
        translationStore,
    } = stores;

    switch (message.type) {
        case notifier.types.VPN_INFO_UPDATED: {
            vpnStore.setVpnInfo(message.data);
            break;
        }
        case notifier.types.LOCATIONS_UPDATED: {
            vpnStore.setLocations(message.data);
            break;
        }
        case notifier.types.LOCATION_STATE_UPDATED: {
            vpnStore.updateLocationState(message.data);
            break;
        }
        case notifier.types.CURRENT_LOCATION_UPDATED: {
            vpnStore.setSelectedLocation(message.data);
            break;
        }
        case notifier.types.PERMISSIONS_ERROR_UPDATE: {
            settingsStore.setGlobalError(message.data);
            // If there is no error, it is time to check if token is premium
            if (!message.data) {
                await vpnStore.requestIsPremiumToken();
            }
            break;
        }
        case notifier.types.TOKEN_PREMIUM_STATE_UPDATED: {
            vpnStore.setIsPremiumToken(message.data);
            break;
        }
        case notifier.types.CONNECTIVITY_STATE_CHANGED: {
            settingsStore.setConnectivityState(message.data);
            break;
        }
        case notifier.types.TOO_MANY_DEVICES_CONNECTED: {
            vpnStore.setTooManyDevicesConnected(true);
            vpnStore.setMaxDevicesAllowed(message.data);
            break;
        }
        case notifier.types.SERVER_ERROR: {
            settingsStore.openServerErrorPopup();
            break;
        }
        case notifier.types.SETTING_UPDATED: {
            if (
                message.data === SETTINGS_IDS.HELP_US_IMPROVE
                && typeof message.value === 'boolean'
            ) {
                telemetryStore.setIsHelpUsImproveEnabled(message.value);
            }
            break;
        }
        case notifier.types.SHOW_RATE_MODAL: {
            authStore.setShouldShowRateModal(true);
            break;
        }
        case notifier.types.STATS_UPDATED: {
            await statsStore.updateStatistics();
            break;
        }
        case notifier.types.AUTH_CACHE_UPDATED: {
            authStore.handleAuthCacheUpdate(message.data, message.value);
            break;
        }
        case notifier.types.LANGUAGE_CHANGED: {
            await translationStore.setLocalePreference(message.data);
            break;
        }
        case notifier.types.USER_AUTHENTICATED: {
            authStore.setIsAuthenticated(true);
            send(PopupEvent.UserAuthenticated);
            break;
        }
        case notifier.types.USER_DEAUTHENTICATED: {
            authStore.setIsAuthenticated(false);
            send(PopupEvent.UserDeauthenticated);
            break;
        }
        case notifier.types.PROFILE_SWITCH_IN_PROGRESS: {
            vpnStore.startSwitchingProfile(message.data);
            break;
        }
        case notifier.types.ACTIVE_PROFILE_CHANGED: {
            vpnStore.handleProfileChanged(message.data);
            break;
        }
        default: {
            log.debug('[vpn.popupNotifier]: there is no such message type: ', message.type);
            break;
        }
    }
};

/**
 * Subscribes the popup to background notifier messages for its lifetime.
 *
 * Sets up a long-lived connection, routes each message to
 * {@link handlePopupNotifierMessage}, and registers the telemetry page id.
 * Tears down the connection, page id and system-theme tracking on unmount.
 *
 * The store dependencies are injected (rather than read from the React context
 * inside the hook) so this module has no runtime import of the store tree and
 * stays free of side effects at import time.
 *
 * @param send Send function for the popup state machine.
 * @param deps The store instances the subscription reads from.
 */
export const usePopupNotifier = (send: PopupSend, deps: PopupNotifierDeps): void => {
    useEffect(() => {
        const { telemetryStore, settingsStore } = deps;

        settingsStore.trackSystemTheme();

        const messageHandler = async (message: NotifierMessage): Promise<void> => {
            await handlePopupNotifierMessage(message, deps, send);
        };

        const { onUnload, portId } = messenger.createLongLivedConnection(
            POPUP_NOTIFIER_EVENTS,
            messageHandler,
        );

        telemetryStore.setPageId(portId);

        return (): void => {
            telemetryStore.setPageId(null);
            onUnload();
            settingsStore.stopTrackSystemTheme();
        };
    }, [deps, send]);
};
