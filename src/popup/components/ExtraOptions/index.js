import React, { useContext } from 'react';
import Modal from 'react-modal';
import './extra-options.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../stores';
import popupActions from '../../actions/popupActions';
import { POPUP_STORE_URL, OTHER_PRODUCTS_URL } from '../../../background/config';

const ExtraOptions = observer(() => {
    const { uiStore, settingsStore, authStore } = useContext(rootStore);
    const openSettings = async () => {
        await adguard.actions.openOptionsPage();
    };

    const addToWhitelist = async () => {
        uiStore.closeOptionsModal();
        await settingsStore.addToWhitelist();
    };

    const removeFromWhitelist = async () => {
        uiStore.closeOptionsModal();
        await settingsStore.removeFromExclusions();
    };

    const signOut = async () => {
        uiStore.closeOptionsModal();
        await authStore.deauthenticate();
    };

    const handleRateUs = async () => {
        await popupActions.openTab(POPUP_STORE_URL);
    };

    const handleOtherProductsClick = async () => {
        await popupActions.openTab(OTHER_PRODUCTS_URL);
    };

    const { isExcluded } = settingsStore;
    const renderWhitelistSetting = (isExcluded) => {
        if (isExcluded) {
            return (
                <button
                    type="button"
                    className="button button--inline extra-options__item"
                    onClick={removeFromWhitelist}
                >
                    Remove this site from exclusions
                </button>
            );
        }
        return (
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={addToWhitelist}
            >
                Add this site to exclusions
            </button>
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
            {renderWhitelistSetting(isExcluded)}
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={handleOtherProductsClick}
            >
                Other products
            </button>
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={handleRateUs}
            >
                Rate us
            </button>
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={openSettings}
            >
                Settings
            </button>
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={signOut}
            >
                Sign out
            </button>
        </Modal>
    );
});

export default ExtraOptions;
