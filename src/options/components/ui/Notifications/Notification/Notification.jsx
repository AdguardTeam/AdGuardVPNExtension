import React, { useContext, useEffect } from 'react';
import cn from 'classnames';
import { rootStore } from '../../../../stores';

const NOTIFICATION_CLEAR_TIMEOUT_MS = 5000;

export const Notification = ({ notification }) => {
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

    return (
        <div className={notificationClassnames}>
            <div className="notification__message">
                {notification.message}
            </div>
            <button
                className="button"
                onClick={handleCloseNotification}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
        </div>
    );
};
