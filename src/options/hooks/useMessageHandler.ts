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
];

export const useMessageHandler = (): void => {
    const {
        authStore,
        settingsStore,
        globalStore,
        exclusionsStore,
        telemetryStore,
    } = useContext(rootStore);

    const reloadingRef = useRef<boolean>(false);

    const messageHandler = async (message: NotifierMessage): Promise<void> => {
        const { type, data, value } = message;

        switch (type) {
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
                    data === SETTINGS_IDS.HELP_US_IMPROVE
                    && typeof value === 'boolean'
                ) {
                    telemetryStore.setIsHelpUsImproveEnabled(value);
                }
                break;
            }
            default: {
                log.debug('[vpn.useMessageHandler]: Undefined message type:', type);
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
