import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { getForwarderUrl } from '../../../common/helpers';
import { reactTranslator } from '../../../common/reactTranslator';
import { popupActions } from '../../actions/popupActions';
import { rootStore } from '../../stores';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { IconButton } from '../../../common/components/Icons';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';

import './vpn-blocked-details.pcss';

/**
 * Component for displaying connection error details.
 */
export const VpnBlockedDetails = observer(() => {
    const { uiStore, settingsStore, telemetryStore } = useContext(rootStore);

    const isOpen = uiStore.isShownVpnBlockedErrorDetails;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogDesktopVersionPromo,
        isOpen,
    );

    const { forwarderDomain } = settingsStore;

    const openDownloadPage = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.GetDesktopClick,
            TelemetryScreenName.DialogDesktopVersionPromo,
        );
        popupActions.openTab(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.VPN_BLOCKED_GET_APP));
    };

    /**
     * Closes the error notice by changing the flag in the **settingsStore**.
     */
    const closeErrorDetails = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.DeclineDesktopClick,
            TelemetryScreenName.DialogDesktopVersionPromo,
        );
        uiStore.closeVpnBlockedErrorDetails();
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
                {reactTranslator.getMessage('popup_vpn_blocked_error_details_title')}
            </div>
            <div className="vpn-blocked-details__description">
                {reactTranslator.getMessage('popup_vpn_blocked_error_details_description')}
            </div>

            <button
                type="button"
                className="button button--medium button--medium--wide button--green vpn-blocked-details__button"
                onClick={openDownloadPage}
            >
                {reactTranslator.getMessage('popup_vpn_blocked_error_details_get_app_button')}
            </button>
            <button
                type="button"
                className="button button--medium button--medium--wide button--outline-secondary vpn-blocked-details__button"
                onClick={closeErrorDetails}
            >
                {reactTranslator.getMessage('popup_vpn_blocked_error_details_later_button')}
            </button>
        </Modal>
    );
});
