import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { POPUP_FEEDBACK_URL, OTHER_PRODUCTS_URL } from '../../../background/config';
import { messenger } from '../../../lib/messenger';
import { Option } from './Option';
import { reactTranslator } from '../../../common/reactTranslator';
import { RatePopup } from '../RatePopup';

import './extra-options.pcss';

export const ExtraOptions = observer(() => {
    const {
        uiStore,
        settingsStore,
        authStore,
        vpnStore,
    } = useContext(rootStore);

    const {
        isRateVisible,
        isExcluded,
    } = settingsStore;

    const { isPremiumToken } = vpnStore;

    const openSettings = async (): Promise<void> => {
        await messenger.openOptionsPage();
        window.close();
    };

    const signOut = async (): Promise<void> => {
        await authStore.deauthenticate();
        await settingsStore.setProxyState(false);
        await settingsStore.clearPermissionError();
        uiStore.closeOptionsModal();
    };

    const handleFeedback = async (): Promise<void> => {
        await popupActions.openTab(POPUP_FEEDBACK_URL);
    };

    const handleOtherProductsClick = async (): Promise<void> => {
        await popupActions.openTab(OTHER_PRODUCTS_URL);
    };

    const removeFromExclusions = async (): Promise<void> => {
        await settingsStore.enableVpnOnCurrentTab();
        uiStore.closeOptionsModal();
    };

    const addToExclusions = async (): Promise<void> => {
        await settingsStore.disableVpnOnCurrentTab();
        uiStore.closeOptionsModal();
    };

    return (
        <Modal
            isOpen={uiStore.isOpenOptionsModal}
            shouldCloseOnOverlayClick
            onRequestClose={uiStore.closeOptionsModal}
            className="extra-options"
            overlayClassName="modal__overlay extra-options__overlay"
        >
            {!isExcluded
                ? (
                    <Option
                        handler={addToExclusions}
                        text={reactTranslator.getMessage('popup_settings_disable_vpn')}
                    />
                )
                : (
                    <Option
                        handler={removeFromExclusions}
                        text={reactTranslator.getMessage('popup_settings_enable_vpn')}
                    />
                )}
            <Option
                handler={handleOtherProductsClick}
                text={reactTranslator.getMessage('popup_settings_other_products')}
            />
            <Option
                handler={openSettings}
                text={reactTranslator.getMessage('popup_settings_open_settings')}
            />
            {!isPremiumToken && (
                <>
                    <Option
                        text={reactTranslator.getMessage('popup_settings_stats')}
                    />
                    zxcvbnm
                </>
            )}
            {isRateVisible
                ? <RatePopup />
                : (
                    <Option
                        handler={handleFeedback}
                        text={reactTranslator.getMessage('popup_settings_feedback')}
                    />
                )}
            <Option
                handler={signOut}
                text={reactTranslator.getMessage('popup_settings_sign_out')}
            />
        </Modal>
    );
});
