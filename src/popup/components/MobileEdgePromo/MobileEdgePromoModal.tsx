import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { translator } from '../../../common/translator';
import { IconButton } from '../../../common/components/Icons';
import { rootStore } from '../../stores';

import './mobile-edge-promo-modal.pcss';

/**
 * Component for displaying mobile Edge promo modal.
 */
export const MobileEdgePromoModal = observer(() => {
    const { settingsStore, telemetryStore, uiStore } = useContext(rootStore);

    const { shouldShowMobileEdgePromoModal } = uiStore;

    /**
     * Closes the mobile Edge promo modal.
     */
    const handleCloseModal = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.DeclineAndroidPromoClick,
            TelemetryScreenName.HomeScreen,
        );
        uiStore.closeMobileEdgePromoModal();
    };

    /**
     * Handles the click on the "Got it" button — just closes the modal.
     */
    const handleGotItClick = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.GotItAndroidPromoClick,
            TelemetryScreenName.HomeScreen,
        );
        uiStore.closeMobileEdgePromoModal();
    };

    /**
     * Handles the click on the "Do not show again" button —
     * closes the modal and hides the mobile Edge promo banner.
     */
    const handleDoNotShowAgainClick = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.DontShowAndroidPromoClick,
            TelemetryScreenName.HomeScreen,
        );
        uiStore.closeMobileEdgePromoModal();
        await settingsStore.hideMobileEdgePromoBanner();
    };

    return (
        <Modal
            isOpen={shouldShowMobileEdgePromoModal}
            shouldCloseOnOverlayClick
            onRequestClose={handleCloseModal}
            overlayClassName="modal__overlay"
            className="mobile-edge-promo-modal"
        >
            <IconButton
                name="cross"
                className="close-icon-btn"
                onClick={handleCloseModal}
            />

            <div className="mobile-edge-promo-modal__content">
                <div className="mobile-edge-promo-modal__image" />

                <h2 className="mobile-edge-promo-modal__title">
                    {translator.getMessage('popup_mobile_edge_promo_modal_title')}
                </h2>

                <span className="mobile-edge-promo-modal__text">
                    {translator.getMessage('popup_mobile_edge_promo_modal_description')}
                </span>
            </div>

            <div className="mobile-edge-promo-modal__actions">
                <button
                    type="button"
                    className="button button--medium button--green mobile-edge-promo-modal__button"
                    onClick={handleGotItClick}
                >
                    {translator.getMessage('popup_mobile_edge_promo_modal_got_it_btn')}
                </button>
                <button
                    type="button"
                    className="button button--medium button--outline-secondary mobile-edge-promo-modal__button"
                    onClick={handleDoNotShowAgainClick}
                >
                    {translator.getMessage('popup_mobile_edge_promo_modal_do_not_show_btn')}
                </button>
            </div>
        </Modal>
    );
});
