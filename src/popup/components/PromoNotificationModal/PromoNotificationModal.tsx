import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { popupActions } from '../../actions/popupActions';
import { messenger } from '../../../common/messenger';
import { Icon } from '../../../common/components/Icons';
import { rootStore } from '../../stores';

import './promo-notification-modal.pcss';

const PromoNotificationModal = observer(() => {
    const { settingsStore, authStore } = useContext(rootStore);

    const [showModal, setShowModal] = useState(true);

    useEffect(() => {
        messenger.setNotificationViewed(true);
    }, []);

    const { promoNotification, showNotificationModal } = settingsStore;

    if (!showNotificationModal || !promoNotification) {
        return null;
    }

    const { url, text, bgImage } = promoNotification;

    if (!url || !text || !bgImage) {
        return null;
    }

    const promoStyle = {
        backgroundImage: `url(${bgImage})`,
    };

    const { btn, title } = text;

    const btnClickHandler = async (): Promise<void> => {
        await messenger.setNotificationViewed(false);
        const resUrl = new URL(url);
        // Email is added here because notification's url is constructed during service worker startup
        // and if user will sign in to another account then notification's url will not be updated. AG-45535
        if (authStore.username) {
            resUrl.searchParams.set('email', authStore.username);
        }
        await popupActions.openTab(resUrl.toString());
    };

    const onCloseHandler = async (): Promise<void> => {
        setShowModal(false);
        await messenger.setNotificationViewed(false);
    };

    return (
        <Modal
            isOpen={showModal}
            shouldCloseOnOverlayClick={false}
            onRequestClose={onCloseHandler}
            className="notify__wrap"
            overlayClassName="notify"
        >
            <div
                className="notify__promo"
                style={promoStyle}
            >
                <div
                    className="notify__close"
                    onClick={onCloseHandler}
                >
                    <Icon name="cross" />
                </div>
                <div className="notify__content">
                    <div className="notify__title">
                        {title}
                    </div>
                    {btn && (
                        <div
                            className="notify__btn"
                            onClick={btnClickHandler}
                        >
                            {btn}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
});

export { PromoNotificationModal };
