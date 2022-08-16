import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';

import './confirm-email.pcss';

export const ConfirmEmail = observer(() => {
    const { authStore } = useContext(rootStore);
    const { showConfirmEmailModal, setShowConfirmEmailModal, userEmail } = authStore;

    const closeModal = () => {
        setShowConfirmEmailModal(false);
    };

    return (
        <Modal
            isOpen={showConfirmEmailModal}
            className="modal confirm-email"
            shouldCloseOnOverlayClick
            overlayClassName="modal__overlay"
            onRequestClose={closeModal}
        >
            <button
                type="button"
                className="button button--icon modal__close-icon"
                onClick={closeModal}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
            <img
                src="../../../../assets/images/confirm-email.svg"
                className="confirm-email__image"
                alt="confirm email"
            />
            <div className="modal__title">
                {reactTranslator.getMessage('confirm_email_title')}
            </div>
            <div className="confirm-email__info">
                {reactTranslator.getMessage('confirm_email_info')}
            </div>
            <div className="confirm-email__email">
                {userEmail}
            </div>
            <button
                type="button"
                className="button button--medium button--medium--wide button--green confirm-email__button"
                onClick={closeModal}
            >
                {reactTranslator.getMessage('confirm_email_close_button')}
            </button>
            <button
                type="button"
                className="button button--medium button--medium--wide button--outline-secondary confirm-email__button"
                onClick={() => {}}
            >
                {reactTranslator.getMessage('confirm_email_resend_link_button')}
            </button>
        </Modal>
    );
});
