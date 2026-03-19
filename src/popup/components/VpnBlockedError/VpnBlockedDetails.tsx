import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { getForwarderUrl } from '../../../common/helpers';
import { translator } from '../../../common/translator';
import { navActions } from '../../../common/actions/navActions';
import { rootStore } from '../../stores';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { IconButton } from '../../../common/components/Icons';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';

import './vpn-blocked-details.pcss';

/**
 * Component for displaying connection error details.
 */
export const VpnBlockedDetails = observer(() => {
    const {
        uiStore,
        settingsStore,
        telemetryStore,
    } = useContext(rootStore);

    const isOpen = uiStore.isShownVpnBlockedErrorDetails;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogDesktopVersionPromo,
        isOpen,
    );

    const {
        forwarderDomain,
        isLinux,
        isAndroidBrowser,
    } = settingsStore;

    const openDownloadPage = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.GetDesktopClick,
            TelemetryScreenName.DialogDesktopVersionPromo,
        );
        const forwarderQuery = isLinux
            ? FORWARDER_URL_QUERIES.VPN_BLOCKED_GET_APP_LINUX
            : FORWARDER_URL_QUERIES.VPN_BLOCKED_GET_APP;
        navActions.openTab(getForwarderUrl(forwarderDomain, forwarderQuery));
    };

    /**
     * Closes the error notice by changing the flag in the **settingsStore**.
     */
    const closeErrorDetails = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.DeclineDesktopClick,
            TelemetryScreenName.DialogDesktopVersionPromo,
        );
        uiStore.closeVpnBlockedErrorDetails();
    };

    /**
     * Gets the appropriate title message based on OS.
     *
     * @returns Translated title message.
     */
    const getTitleMessage = (): string => {
        if (isLinux) {
            return translator.getMessage('popup_vpn_blocked_error_details_title_linux');
        }
        if (isAndroidBrowser) {
            return translator.getMessage('popup_vpn_blocked_error_details_title_mobile');
        }
        return translator.getMessage('popup_vpn_blocked_error_details_title');
    };

    /**
     * Gets the appropriate description message based on OS.
     *
     * @returns Translated description message.
     */
    const getDescriptionMessage = (): string => {
        if (isLinux) {
            return translator.getMessage('popup_vpn_blocked_error_details_description_linux');
        }
        if (isAndroidBrowser) {
            return translator.getMessage('popup_vpn_blocked_error_details_description_mobile');
        }
        return translator.getMessage('popup_vpn_blocked_error_details_description');
    };

    /**
     * Gets the appropriate button message based on OS.
     *
     * @returns Translated button text.
     */
    const getButtonMessage = (): string => {
        if (isLinux) {
            return translator.getMessage('popup_vpn_blocked_error_details_get_app_button_linux');
        }
        return translator.getMessage('popup_vpn_blocked_error_details_get_app_button');
    };

    return (
        <Modal
            isOpen={isOpen}
            className="modal vpn-blocked-details"
            shouldCloseOnOverlayClick
            overlayClassName="modal__overlay"
            onRequestClose={closeErrorDetails}
        >
            <IconButton
                name="cross"
                className="close-icon-btn"
                onClick={closeErrorDetails}
            />

            <div className="vpn-blocked-details__image" />

            <div className="modal__title vpn-blocked-details__title">
                {getTitleMessage()}
            </div>
            <div className="vpn-blocked-details__description">
                {getDescriptionMessage()}
            </div>

            <button
                type="button"
                className="button button--medium button--medium--wide button--green vpn-blocked-details__button"
                onClick={openDownloadPage}
            >
                {getButtonMessage()}
            </button>
            <button
                type="button"
                className="button button--medium button--medium--wide button--outline-secondary vpn-blocked-details__button"
                onClick={closeErrorDetails}
            >
                {translator.getMessage('popup_vpn_blocked_error_details_later_button')}
            </button>
        </Modal>
    );
});
