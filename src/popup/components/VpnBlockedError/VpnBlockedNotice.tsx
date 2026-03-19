import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { rootStore } from '../../stores';
import { Icon, IconButton } from '../../../common/components/Icons';
import { translator } from '../../../common/translator';

import './vpn-blocked-notice.pcss';

/**
 * Component to display notice about connection error.
 * Shows different message for users in affected regions.
 */
export const VpnBlockedNotice = observer(() => {
    const {
        uiStore,
        settingsStore,
    } = useContext(rootStore);

    const { shouldShowRegionNotice } = uiStore;
    const {
        isLinux,
        isAndroidBrowser,
    } = settingsStore;

    /**
     * Closes the error notice by changing the flag in the uiStore.
     */
    const closeNotice = (): void => {
        uiStore.closeVpnBlockedErrorNotice();
    };

    /**
     * Opens connection error details by changing the flag in the uiStore.
     */
    const openDetails = (): void => {
        uiStore.openVpnBlockedErrorDetails();
    };

    /**
     * Gets the appropriate message based on region notice flag and OS.
     *
     * @returns Translated notice message.
     */
    const getNoticeMessage = (): string => {
        if (!shouldShowRegionNotice) {
            return translator.getMessage('popup_vpn_blocked_error_notice');
        }

        if (isLinux) {
            return translator.getMessage('popup_vpn_blocked_error_notice_alt_linux');
        }

        if (isAndroidBrowser) {
            return translator.getMessage('popup_vpn_blocked_error_notice_alt_mobile');
        }

        return translator.getMessage('popup_vpn_blocked_error_notice_alt');
    };

    return (
        <div className="vpn-blocked-notice">
            <button
                type="button"
                className="vpn-blocked-notice__warning-icon"
                tabIndex={-1}
            >
                <Icon name="warning" />
            </button>

            <IconButton
                name="cross"
                className="vpn-blocked-notice__close-btn"
                onClick={closeNotice}
            />

            <button
                type="button"
                className={cn(
                    'vpn-blocked-notice__details-link',
                    shouldShowRegionNotice && 'vpn-blocked-notice__details-link--no-underline',
                )}
                onClick={openDetails}
            >
                {getNoticeMessage()}
            </button>
        </div>
    );
});
