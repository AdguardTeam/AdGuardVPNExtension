import React, { Component } from 'react';
import Modal from 'react-modal';
import './options-popup.pcss';
import { uiStore } from '../../stores';
import background from '../../../lib/background-service';

class OptionsModal extends Component {
    openSettings = async () => {
        const actions = await background.getActionsModule();
        await actions.openOptionsPage();
    };

    render() {
        return (
            <Modal
                isOpen={uiStore.isOpenOptionsModal}
                shouldCloseOnOverlayClick
                onRequestClose={uiStore.closeOptionsModal}
                className="options_modal"
                overlayClassName="options_modal_overlay"
            >
                <div className="popup_setting">Add this site in a whitelist</div>
                <div className="popup_setting">Buy a licence</div>
                <div className="popup_setting">Other products</div>
                <div className="popup_setting" onClick={this.openSettings}>Settings</div>
            </Modal>
        );
    }
}

export default OptionsModal;
