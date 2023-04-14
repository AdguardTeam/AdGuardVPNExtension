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

    if (!promoNotification) {
        return null;
    }

    const { url, text } = promoNotification;

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
            className="notify__wrap"
            overlayClassName="notify"
        >
            <div className="notify__promo">
                <div
                    className="notify__close"
                    onClick={onCloseHandler}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#cross_gray" />
                    </svg>
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
