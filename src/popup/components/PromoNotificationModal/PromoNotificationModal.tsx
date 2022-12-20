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

    const btnClickHandler = async (): Promise<void> => {
        // FIXME: settingsStore to ts and remove @ts-ignore on next line
        // @ts-ignore
        const { url } = promoNotification;

        if (!url) {
            return;
        }

        await messenger.setNotificationViewed(false);
        await popupActions.openTab(url);
    };

    const onCloseHandler = async (): Promise<void> => {
        setShowModal(false);
        await messenger.setNotificationViewed(false);
    };

    if (!promoNotification) {
        return null;
    }

    // FIXME: settingsStore to ts and remove @ts-ignore on next line
    // @ts-ignore
    const { btn, title } = promoNotification.text;

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
