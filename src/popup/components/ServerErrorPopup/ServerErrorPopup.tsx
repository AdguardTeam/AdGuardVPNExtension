import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';

import './server-error-popup.pcss';

export const ServerErrorPopup = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { showServerErrorPopup, closeServerErrorPopup } = settingsStore;

    const closeModal = () => {
        closeServerErrorPopup();
    };

    return (
        <Modal
            isOpen={showServerErrorPopup}
            className="modal server-error-modal"
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
                src="../../../assets/images/server-error-ninja.svg"
                className="server-error-modal__image"
                alt="server error"
            />
            <div className="modal__title">
                {reactTranslator.getMessage('popup_server_error_popup_title')}
            </div>
            <div className="server-error-modal__info">
                {reactTranslator.getMessage('popup_server_error_popup_info')}
            </div>
            <button
                type="button"
                className="button button--medium button--medium--wide button--green server-error-modal__button"
                onClick={closeModal} // FIXME add proper handler
            >
                {reactTranslator.getMessage('popup_server_error_popup_action')}
            </button>
            <button
                type="button"
                className="button button--medium button--medium--wide button--outline-secondary server-error-modal__button"
                onClick={closeModal}
            >
                {reactTranslator.getMessage('popup_server_error_popup_cancel')}
            </button>
        </Modal>
    );
});
