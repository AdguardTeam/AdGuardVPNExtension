import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { PATH_TO_RATING_IMAGES, RATING_IMAGES_MAP } from './constants';
import { POPUP_STORE_URL, FEEDBACK_URL } from '../../../background/config';

import './rate-modal.pcss';

const bad = {
    title: 'Help us improve',
    subtitle: 'Tell us what went wrong',
    buttonText: 'Leave feedback',
};

const good = {
    title: 'Wow! Can you rate us also in the Chrome Store?',
    subtitle: '',
    buttonText: 'Go to the Chrome Store',
};

export const ConfirmRateModal = observer(() => {
    const { uiStore } = useContext(rootStore);
    const { rating, isConfirmRateModalVisible } = uiStore;

    const content = rating > 3 ? good : bad;

    const closeModal = () => {
        uiStore.closeConfirmRateModal();
    };

    const handleConfirm = () => {
        if (rating > 3) {
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
                Cancel
            </button>
        </Modal>
    );
});
