import { useContext, useRef } from 'react';

import { notifier } from '../../common/notifier';
import { type NotifierMessage } from '../../common/messenger';
import { SETTINGS_IDS } from '../../common/constants';
import { log } from '../../common/logger';
import { rootStore } from '../stores';
import { useSubscribeNotifier } from '../../common/hooks/useSubscribeNotifier';

const NOTIFIER_EVENTS = [
    notifier.types.EXCLUSIONS_DATA_UPDATED,
    notifier.types.USER_AUTHENTICATED,
    notifier.types.USER_DEAUTHENTICATED,
    notifier.types.SETTING_UPDATED,
    notifier.types.LANGUAGE_CHANGED,
    notifier.types.PROFILE_LOCATION_UPDATED,
    notifier.types.ACTIVE_PROFILE_CHANGED,
    notifier.types.PROFILE_SWITCH_IN_PROGRESS,
];

export const useMessageHandler = (): void => {
    const {
        authStore,
        settingsStore,
        globalStore,
        exclusionsStore,
        telemetryStore,
        translationStore,
        profilesStore,
    } = useContext(rootStore);

    const reloadingRef = useRef<boolean>(false);

    const messageHandler = async (message: NotifierMessage): Promise<void> => {
        switch (message.type) {
            case notifier.types.EXCLUSIONS_DATA_UPDATED: {
                await exclusionsStore.updateExclusionsData();
                break;
            }
            case notifier.types.USER_AUTHENTICATED: {
                await globalStore.getOptionsData(reloadingRef.current);
                await settingsStore.updateCurrentUsername();
                break;
            }
            case notifier.types.USER_DEAUTHENTICATED: {
                authStore.setIsAuthenticated(false);
                await settingsStore.updateCurrentUsername();
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
            case notifier.types.LANGUAGE_CHANGED: {
                settingsStore.setSelectedLanguage(message.data);
                await translationStore.setLocalePreference(message.data);
                break;
            }
            case notifier.types.PROFILE_LOCATION_UPDATED: {
                profilesStore.updateLocationCache(message.data, message.value);
                break;
            }
            case notifier.types.ACTIVE_PROFILE_CHANGED: {
                profilesStore.handleProfileChanged(message.data);
                break;
            }
            case notifier.types.PROFILE_SWITCH_IN_PROGRESS: {
                profilesStore.startSwitchingProfile(message.data);
                break;
            }
            default: {
                log.debug('[vpn.useMessageHandler]: Undefined message type:', message.type);
                break;
            }
        }
    };

    const onListenersUpdate = (): void => {
        reloadingRef.current = true;
    };

    useSubscribeNotifier(
        NOTIFIER_EVENTS,
        messageHandler,
        onListenersUpdate,
    );
};
