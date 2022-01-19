import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { popupActions } from '../../actions/popupActions';
import { messenger } from '../../../lib/messenger';
import { rootStore } from '../../stores';

import './promo-notification-modal.pcss';

const PromoNotificationModal = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const [showModal, setShowModal] = useState(true);

    useEffect(() => {
        messenger.setNotificationViewed(true);
    }, []);

    const { promoNotification } = settingsStore;

    const btnClickHandler = async () => {
        const { url } = promoNotification;

        if (!url) {
            return;
        }

        await messenger.setNotificationViewed(false);
        await popupActions.openTab(url);
    };

    const onCloseHandler = async () => {
        setShowModal(false);
        await messenger.setNotificationViewed(false);
    };

    if (!promoNotification) {
        return null;
    }

    const { btn, title } = promoNotification.text;

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
                <div className="holiday-notify__title">
                    <div className="holiday-notify__title-in">
                        {title}
                    </div>
                </div>
                {btn
                    && (
                        <div className="holiday-notify__bottom">
                            <div
                                className="holiday-notify__btn"
                                onClick={btnClickHandler}
                            >
                                {btn}
                            </div>
                        </div>
                    )}
            </div>
        </Modal>
    );
});

export { PromoNotificationModal };
