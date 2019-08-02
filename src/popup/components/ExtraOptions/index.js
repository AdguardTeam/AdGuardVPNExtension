import React, { Component } from 'react';
import Modal from 'react-modal';
import './extra-options.pcss';
import { observer } from 'mobx-react';
import { uiStore, settingsStore } from '../../stores';
import bgProvider from '../../../lib/background-provider';

Modal.setAppElement('#root');

@observer
class ExtraOptions extends Component {
    openSettings = async () => {
        await bgProvider.actions.openOptionsPage();
    };

    async addToWhitelist() {
        await settingsStore.addToWhitelist();
    }

    async removeFromWhitelist() {
        await settingsStore.removeFromWhitelist();
    }

    render() {
        const { isWhitelisted } = settingsStore;
        const renderWhitelistSetting = (isWhitelisted) => {
            if (isWhitelisted) {
                return (
                    <div
                        className="button button--inline extra-options__item"
                        onClick={this.removeFromWhitelist}
                    >
                        Remove this site from a whitelist
                    </div>
                );
            }
            return (
                <div
                    className="button button--inline extra-options__item"
                    onClick={this.addToWhitelist}
                >
                    Add this site in a whitelist
                </div>
            );
        };
        return (
            <Modal
                isOpen={uiStore.isOpenOptionsModal}
                shouldCloseOnOverlayClick
                onRequestClose={uiStore.closeOptionsModal}
                className="extra-options"
                overlayClassName="extra-options__overlay"
            >
                {renderWhitelistSetting(isWhitelisted)}
                <a href="#" className="button button--inline extra-options__item">
                    Buy a licence
                </a>
                <a href="#" className="button button--inline extra-options__item">
                    Other products
                </a>
                <div
                    className="button button--inline extra-options__item"
                    onClick={this.openSettings}
                >
                    Settings
                </div>
            </Modal>
        );
    }
}

export default ExtraOptions;
