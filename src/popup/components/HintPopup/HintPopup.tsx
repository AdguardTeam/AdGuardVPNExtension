import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';

import './hint-popup.pcss';
import { reactTranslator } from '../../../common/reactTranslator';

export const HintPopup = observer(() => {
    const { authStore } = useContext(rootStore);

    const { showHintPopup } = authStore;

    const closePopup = async () => {
        await authStore.closeHintPopup();
    };

    return (
        <Modal
            isOpen={showHintPopup}
            className="modal hint-popup"
            shouldCloseOnOverlayClick
            overlayClassName="modal__overlay modal__overlay--dark"
            onRequestClose={closePopup}
        >
            <div className="hint-popup__content">
                {reactTranslator.getMessage('popup_hint_popup_content')}
            </div>
            <button
                type="button"
                className="button button--simple-green hint-popup__button"
                onClick={closePopup}
            >
                {reactTranslator.getMessage('popup_hint_popup_button')}
            </button>
        </Modal>
    );
});
