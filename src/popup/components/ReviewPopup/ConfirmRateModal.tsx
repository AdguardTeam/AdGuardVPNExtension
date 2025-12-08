import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { reactTranslator } from '../../../common/reactTranslator';
import { getForwarderUrl } from '../../../common/helpers';
import { IconButton } from '../../../common/components/Icons';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { navActions } from '../../../common/actions/navActions';

import { RATING_IMAGES_MAP } from './constants';

import './rate-modal.pcss';

const BAD_RATING_LIMIT = 3;

const feedbackContent = {
    title: reactTranslator.getMessage('popup_confirm_rate_modal_feedback_title'),
    subtitle: reactTranslator.getMessage('popup_confirm_rate_modal_feedback_subtitle'),
    buttonText: reactTranslator.getMessage('popup_confirm_rate_modal_leave_feedback_button'),
};

const storeRatingContent = {
    title: reactTranslator.getMessage('popup_confirm_rate_modal_rate_title'),
    subtitle: '',
    buttonText: reactTranslator.getMessage('popup_confirm_rate_modal_confirm_button'),
};

export const ConfirmRateModal = observer(() => {
    const { authStore, settingsStore, telemetryStore } = useContext(rootStore);
    const { rating, showConfirmRateModal } = authStore;
    const { forwarderDomain } = settingsStore;

    const isStoreRating = rating > BAD_RATING_LIMIT;
    const content = isStoreRating ? storeRatingContent : feedbackContent;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogRateInStore,
        isStoreRating && showConfirmRateModal,
    );

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogHelpUsImprove,
        !isStoreRating && showConfirmRateModal,
    );

    const closeModal = async (): Promise<void> => {
        await authStore.closeConfirmRateModalAfterCancel();
    };

    const closeModalWithRating = async (): Promise<void> => {
        await authStore.closeConfirmRateModalAfterRate();
        await settingsStore.hideRate();
    };

    const handleClose = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            isStoreRating
                ? TelemetryActionName.CancelRateStoreClick
                : TelemetryActionName.CancelHelpImproveClick,
            isStoreRating
                ? TelemetryScreenName.DialogRateInStore
                : TelemetryScreenName.DialogHelpUsImprove,
        );
        await closeModal();
    };

    const handleConfirm = async (): Promise<void> => {
        if (isStoreRating) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.RateInStoreClick,
                TelemetryScreenName.DialogRateInStore,
            );
            // Same issue as in RatePopup.tsx
            // This issue reproduces only on macOS, possibly any unix based OS
            // https://github.com/AdguardTeam/AdGuardVPNExtension/issues/150
            await closeModalWithRating();
            await navActions.openWindow(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.POPUP_STORE));
        } else {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.FeedbackHelpImproveClick,
                TelemetryScreenName.DialogHelpUsImprove,
            );
            await closeModal();
            await navActions.openWindow(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FEEDBACK));
        }
    };

    return (
        <Modal
            isOpen={showConfirmRateModal}
            className="modal rate-modal rate-modal--confirm"
            shouldCloseOnOverlayClick
            overlayClassName="modal__overlay"
            onRequestClose={handleClose}
        >
            <IconButton
                name="cross"
                className="close-icon-btn"
                onClick={handleClose}
            />
            <img
                src={RATING_IMAGES_MAP[rating]}
                className="rate-modal__image"
                alt="rating"
            />
            <div className="modal__title rate-modal--confirm__title">{content.title}</div>
            <div className="rate-modal__subtitle rate-modal--confirm__subtitle">{content.subtitle}</div>
            <button
                type="button"
                className="button button--medium button--medium--wide button--green rate-modal__button"
                onClick={handleConfirm}
            >
                {content.buttonText}
            </button>
            <button
                type="button"
                className="button button--medium button--medium--wide button--outline-secondary rate-modal__button"
                onClick={handleClose}
            >
                {reactTranslator.getMessage('popup_rate_modal_cancel_button')}
            </button>
        </Modal>
    );
});
