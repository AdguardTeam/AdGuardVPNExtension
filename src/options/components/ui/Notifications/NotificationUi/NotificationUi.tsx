import React, { useContext, useEffect } from 'react';

import cn from 'classnames';

import { rootStore } from '../../../../stores';
import { Notification } from '../../../../stores/NotificationsStore/Notification';

const NOTIFICATION_CLEAR_TIMEOUT_MS = 5 * 1000;

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

    const isErrorNotification = notification.isError();

    const notificationClassnames = cn('notification', {
        danger: isErrorNotification,
        success: notification.isSuccess(),
    });

    let actionButton;
    if (notification.action) {
        const { action } = notification;

        const handleAction = () => {
            action.handler();
            handleCloseNotification();
        };

        actionButton = (
            <div className="notification__action">
                <button
                    type="button"
                    className="button button--notification notification__message"
                    onClick={handleAction}
                >
                    {action.action}
                </button>
            </div>
        );
    }

    const closeButton = (
        <button
            type="button"
            className="button button--icon"
            onClick={handleCloseNotification}
        >
            <svg className="icon icon--button icon--cross">
                <use xlinkHref="#cross" />
            </svg>
        </button>
    );

    const titleIcon = isErrorNotification
        ? (
            <svg className="icon icon--button icon--warning">
                <use xlinkHref="#warning" />
            </svg>
        )
        : null;

    return (
        <div className={notificationClassnames}>
            <div className="notification__result">
                <div className="notification__message">
                    {titleIcon}
                    <div className="notification__message--title">
                        {notification.message}
                    </div>
                </div>
                {closeButton}
            </div>
            {actionButton}
        </div>
    );
};
