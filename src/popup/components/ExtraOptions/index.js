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
import Rate from '../Rate';
import { PROMO_SALE_STATUSES } from '../../../lib/constants';

const ExtraOptions = observer(() => {
    const { uiStore, settingsStore, authStore } = useContext(rootStore);

    const {
        isRateVisible,
    } = settingsStore;

    const openSettings = async () => {
        await messenger.openOptionsPage();
        window.close();
    };

    const signOut = async () => {
        await authStore.deauthenticate();
        await settingsStore.setProxyState(false);
        await settingsStore.clearPermissionError();
        await settingsStore.setSalePromoStatus(PROMO_SALE_STATUSES.DISPLAY_BEFORE_CLICK);
        uiStore.closeOptionsModal();
    };

    const handleFeedback = async () => {
        await popupActions.openTab(POPUP_FEEDBACK_URL);
    };

    const handleOtherProductsClick = async () => {
        await popupActions.openTab(OTHER_PRODUCTS_URL);
    };

    return (
        <Modal
            isOpen={uiStore.isOpenOptionsModal}
            shouldCloseOnOverlayClick
            onRequestClose={uiStore.closeOptionsModal}
            className="extra-options"
            overlayClassName="extra-options__overlay"
        >
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
            {isRateVisible
                ? <Rate />
                : (
                    <Option
                        handler={handleFeedback}
                        text={reactTranslator.translate('popup_settings_feedback')}
                    />
                )}
        </Modal>
    );
});

export default ExtraOptions;
