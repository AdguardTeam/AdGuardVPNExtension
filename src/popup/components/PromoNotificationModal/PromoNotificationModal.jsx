import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import popupActions from '../../actions/popupActions';
import messenger from '../../../lib/messenger';
import rootStore from '../../stores';

import './promo-notification-modal.pcss';

const PromoNotificationModal = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const [showModal, setShowModal] = useState(true);

    useEffect(() => {
        messenger.setNotificationViewed(true);
    }, []);

    const { promoNotification } = settingsStore;

    const btnClickHandler = async () => {
        if (!promoNotification.url) {
            return;
        }

        await messenger.setNotificationViewed(false);
        await popupActions.openTab(promoNotification.url);
    };

    const onCloseHandler = async () => {
        setShowModal(false);
        await messenger.setNotificationViewed(false);
    };

    if (!promoNotification) {
        return null;
    }

    const { btn } = vpnStore.isPremiumToken
        ? promoNotification.text.premium
        : promoNotification.text.free;

    return (
        <Modal
            isOpen={showModal}
            shouldCloseOnOverlayClick={false}
            onRequestClose={onCloseHandler}
            className="holiday-notify__wrap"
            overlayClassName="holiday-notify"
        >
            <div
                className="holiday-notify__close"
                onClick={onCloseHandler}
            />
            <div className="holiday-notify__content">
                <div className="holiday-notify__title">Black Friday at AdGuard</div>
                {btn
                && (
                    <div
                        className="holiday-notify__btn"
                        onClick={btnClickHandler}
                    >
                        {btn}
                    </div>
                )}
            </div>
        </Modal>
    );
});

export { PromoNotificationModal };
