import React, { useContext } from 'react';
import Modal from 'react-modal';
import './extra-options.pcss';
import { observer } from 'mobx-react';
import rootStore from '../../stores';
import popupActions from '../../actions/popupActions';
import { POPUP_STORE_URL, OTHER_PRODUCTS_URL } from '../../../background/config';
import translator from '../../../lib/translator';

const ExtraOptions = observer(() => {
    const { uiStore, settingsStore, authStore } = useContext(rootStore);
    const openSettings = async () => {
        await adguard.actions.openOptionsPage();
    };

    const addToExclusions = async () => {
        uiStore.closeOptionsModal();
        await settingsStore.addToExclusions();
    };

    const removeFromExclusions = async () => {
        uiStore.closeOptionsModal();
        await settingsStore.removeFromExclusions();
    };

    const signOut = async () => {
        await authStore.deauthenticate();
        await settingsStore.clearPermissionError();
        uiStore.closeOptionsModal();
    };

    const handleRateUs = async () => {
        await popupActions.openTab(POPUP_STORE_URL);
    };

    const handleOtherProductsClick = async () => {
        await popupActions.openTab(OTHER_PRODUCTS_URL);
    };

    const { isExcluded, canBeExcluded, areExclusionsInverted } = settingsStore;

    const exclusionsInverted = areExclusionsInverted();

    const renderExclusionButton = (isExcluded, exclusionsInverted) => {
        const texts = {
            enable: translator.translate('popup_settings_enable_vpn'),
            disable: translator.translate('popup_settings_disable_vpn'),
        };

        const getText = (enable) => {
            if (enable) {
                return texts.enable;
            }
            return texts.disable;
        };

        const buttonsInfo = {
            add: {
                text: getText(exclusionsInverted),
                handler: addToExclusions,
            },
            remove: {
                text: getText(!exclusionsInverted),
                handler: removeFromExclusions,
            },
        };

        const button = isExcluded ? buttonsInfo.remove : buttonsInfo.add;

        return (
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={button.handler}
            >
                {button.text}
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
            {canBeExcluded && renderExclusionButton(isExcluded, exclusionsInverted)}
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={handleOtherProductsClick}
            >
                {translator.translate('popup_settings_other_products')}
            </button>
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={handleRateUs}
            >
                {translator.translate('popup_settings_rate_us')}
            </button>
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={openSettings}
            >
                {translator.translate('popup_settings_open_settings')}
            </button>
            <button
                type="button"
                className="button button--inline extra-options__item"
                onClick={signOut}
            >
                {translator.translate('popup_settings_sign_out')}
            </button>
        </Modal>
    );
});

export default ExtraOptions;
