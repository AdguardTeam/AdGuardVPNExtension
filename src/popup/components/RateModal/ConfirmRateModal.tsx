import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { PATH_TO_RATING_IMAGES, RATING_IMAGES_MAP } from './constants';
import { POPUP_STORE_URL, FEEDBACK_URL } from '../../../background/config';
import { reactTranslator } from '../../../common/reactTranslator';

import './rate-modal.pcss';

const BAD_RATING_LIMIT = 3;

const feedbackContent = {
    title: reactTranslator.getMessage('popup_confirm_rate_modal_feedback_title'),
    subtitle: reactTranslator.getMessage('popup_confirm_rate_modal_feedback_title'),
    buttonText: reactTranslator.getMessage('popup_confirm_rate_modal_leave_feedback_button'),
};

const storeRatingContent = {
    title: reactTranslator.getMessage('popup_confirm_rate_modal_rate_title'),
    subtitle: '',
    buttonText: reactTranslator.getMessage('popup_confirm_rate_modal_confirm_button'),
};

export const ConfirmRateModal = observer(() => {
    const { uiStore } = useContext(rootStore);
    const { rating, isConfirmRateModalVisible } = uiStore;

    const content = rating > BAD_RATING_LIMIT ? storeRatingContent : feedbackContent;

    const closeModal = () => {
        uiStore.closeConfirmRateModal();
    };

    const handleConfirm = () => {
        if (rating > BAD_RATING_LIMIT) {
            window.open(POPUP_STORE_URL, '_blank');
        } else {
            window.open(FEEDBACK_URL, '_blank');
        }
        closeModal();
    };

    const getMainImagePath = () => {
        return `${PATH_TO_RATING_IMAGES}${RATING_IMAGES_MAP[rating]}`;
    };

    return (
        <Modal
            isOpen={isConfirmRateModalVisible}
            className="confirm-rate-modal"
            shouldCloseOnOverlayClick
            overlayClassName="confirm-rate-modal__overlay"
            onRequestClose={closeModal}
        >
            <button
                type="button"
                className="button button--icon confirm-rate-modal__close-icon"
                onClick={closeModal}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
            <img
                src={getMainImagePath()}
                className="confirm-rate-modal__image"
                alt="rating"
            />
            <div className="confirm-rate-modal__title">{content.title}</div>
            <div className="confirm-rate-modal__subtitle">{content.subtitle}</div>
            <button
                type="button"
                className="button button--medium button--green confirm-rate-modal__button"
                onClick={handleConfirm}
            >
                {content.buttonText}
            </button>
            <button
                type="button"
                className="button button--medium button--outline-secondary confirm-rate-modal__button"
                onClick={closeModal}
            >
                {reactTranslator.getMessage('popup_rate_modal_cancel_button')}
            </button>
        </Modal>
    );
});
