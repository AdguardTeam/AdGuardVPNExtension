import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import rootStore from '../../stores';
import popupActions from '../../actions/popupActions';
import { POPUP_FEEDBACK_URL, OTHER_PRODUCTS_URL } from '../../../background/config';
import messenger from '../../../lib/messenger';
import Option from './Option';
import './extra-options.pcss';
import { reactTranslator } from '../../../reactCommon/reactTranslator';
import Rate from '../../../options/components/Sidebar/Rate';

const ExtraOptions = observer(() => {
    const { uiStore, settingsStore, authStore } = useContext(rootStore);
    const openSettings = async () => {
        await messenger.openOptionsPage();
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

    const { isExcluded, canBeExcluded, exclusionsInverted } = settingsStore;

    const renderExclusionButton = (isExcluded, exclusionsInverted) => {
        const texts = {
            enable: reactTranslator.translate('popup_settings_enable_vpn'),
            disable: reactTranslator.translate('popup_settings_disable_vpn'),
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
                text={reactTranslator.translate('popup_settings_other_products')}
            />
            <Option
                handler={openSettings}
                text={reactTranslator.translate('popup_settings_open_settings')}
            />
            <Option
                handler={signOut}
                text={reactTranslator.translate('popup_settings_sign_out')}
            />
            {/* TODO: set real value in state */}
            { false ? <Option
                    handler={handleFeedback}
                    text={reactTranslator.translate('popup_settings_feedback')}
                /> 
                : <Rate
                    title={reactTranslator.translate('settings_rate_us')} 
                    sidebar={false}
                />
            }
        </Modal>
    );
});

export default ExtraOptions;
