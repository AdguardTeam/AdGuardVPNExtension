import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { popupActions } from '../../actions/popupActions';
import { messenger } from '../../../lib/messenger';
import { rootStore } from '../../stores';
import { PromoNotificationData } from '../../../background/promoNotifications';

import './promo-notification-modal.pcss';

const PromoNotificationModal = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const [showModal, setShowModal] = useState(true);

    useEffect(() => {
        messenger.setNotificationViewed(true);
    }, []);

    const { promoNotification } = settingsStore;

    if (!promoNotification) {
        return null;
    }

    const { url, text } = promoNotification as PromoNotificationData;

    if (!url || !text) {
        return null;
    }

    const { btn, title } = text;

    const btnClickHandler = async (): Promise<void> => {
        await messenger.setNotificationViewed(false);
        await popupActions.openTab(url);
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
            className="holiday-notify__wrap"
            overlayClassName="holiday-notify"
        >
            <div className="holiday-notify__promo">
                <div
                    className="holiday-notify__close"
                    onClick={onCloseHandler}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#cross_white" />
                    </svg>
                </div>
                <div className="holiday-notify__content">
                    <div className="holiday-notify__title">
                        {title}
                    </div>
                    {btn && (
                        <div
                            className="holiday-notify__btn"
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
