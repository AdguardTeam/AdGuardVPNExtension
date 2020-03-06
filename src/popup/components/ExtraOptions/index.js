import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import rootStore from '../../stores';
import popupActions from '../../actions/popupActions';
import { POPUP_FEEDBACK_URL, OTHER_PRODUCTS_URL } from '../../../background/config';
import translator from '../../../lib/translator';

import Option from './Option';

import './extra-options.pcss';

const ExtraOptions = observer(() => {
    const { uiStore, settingsStore, authStore } = useContext(rootStore);
    const openSettings = async () => {
        await adguard.actions.openOptionsPage();
        window.close();
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
        await settingsStore.setProxyState(false);
        await settingsStore.clearPermissionError();
        uiStore.closeOptionsModal();
    };

    const handleFeedback = async () => {
        await popupActions.openTab(POPUP_FEEDBACK_URL);
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
            <Option
                handler={button.handler}
                text={button.text}
            />
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
            <Option
                handler={handleOtherProductsClick}
                text={translator.translate('popup_settings_other_products')}
            />
            <Option
                handler={handleFeedback}
                text={translator.translate('popup_settings_feedback')}
            />
            <Option
                handler={openSettings}
                text={translator.translate('popup_settings_open_settings')}
            />
            <Option
                handler={signOut}
                text={translator.translate('popup_settings_sign_out')}
            />
        </Modal>
    );
});

export default ExtraOptions;
