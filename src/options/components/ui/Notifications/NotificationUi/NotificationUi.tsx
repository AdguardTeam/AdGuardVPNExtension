import React, { useContext, useEffect } from 'react';
import cn from 'classnames';

import { rootStore } from '../../../../stores';
import { Notification } from '../../../../stores/NotificationsStore/Notification';

const NOTIFICATION_CLEAR_TIMEOUT_MS = 5000;

interface NotificationProps {
    notification: Notification,
}

export const NotificationUi = ({ notification }: NotificationProps) => {
    const { notificationsStore } = useContext(rootStore);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            notificationsStore.removeNotification(notification.id);
        }, NOTIFICATION_CLEAR_TIMEOUT_MS);

        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    const handleCloseNotification = () => {
        notificationsStore.removeNotification(notification.id);
    };

    const notificationClassnames = cn('notification', {
        danger: notification.isError(),
        success: notification.isSuccess(),
    });

    let button;

    if (notification.action) {
        const { action } = notification;

        const handleAction = () => {
            action.handler();
            handleCloseNotification();
        };

        button = (
            <button
                type="button"
                className="button button--notification notification__button"
                onClick={handleAction}
            >
                {action.action}
            </button>
        );
    } else {
        button = (
            <button
                type="button"
                className="button"
                onClick={handleCloseNotification}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
        );
    }

    return (
        <div className={notificationClassnames}>
            <div className="notification__message">
                {notification.message}
            </div>
            {button}
        </div>
    );
};
