import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { popupActions } from '../../actions/popupActions';
import { POPUP_FEEDBACK_URL, OTHER_PRODUCTS_URL, COMPARE_PAGE } from '../../../background/config';
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
    } = useContext(rootStore);

    const {
        isRateVisible,
        isCurrentTabExcluded,
        canBeExcluded,
    } = settingsStore;

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

    const openComparePage = () => {
        popupActions.openTab(COMPARE_PAGE);
    };

    const renderOption = (key: string, handler: () => void) => {
        return (
            <Option
                text={reactTranslator.getMessage(key)}
                handler={handler}
            />
        );
    };

    return (
        <Modal
            isOpen={uiStore.isOpenOptionsModal}
            shouldCloseOnOverlayClick
            onRequestClose={uiStore.closeOptionsModal}
            className="extra-options"
            overlayClassName="modal__overlay extra-options__overlay"
        >
            {canBeExcluded && !isCurrentTabExcluded
                && renderOption('popup_settings_disable_vpn', addToExclusions)}

            {canBeExcluded && isCurrentTabExcluded
                && renderOption('popup_settings_enable_vpn', removeFromExclusions)}

            {renderOption('popup_settings_other_products', handleOtherProductsClick)}

            {renderOption('popup_settings_open_settings', openSettings)}

            {renderOption('popup_compare_button', openComparePage)}

            {isRateVisible
                ? <RatePopup />
                : renderOption('popup_settings_feedback', handleFeedback)}

            {renderOption('popup_settings_sign_out', signOut)}
        </Modal>
    );
});
