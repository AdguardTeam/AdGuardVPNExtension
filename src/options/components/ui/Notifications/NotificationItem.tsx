import React, { useEffect } from 'react';

import classNames from 'classnames';

import { type Notification } from '../../../stores/NotificationsStore/Notification';
import { IconButton } from '../Icon';

const NOTIFICATION_CLEAR_TIMEOUT_MS = 5 * 1000; // 5s

export interface NotificationItemProps {
    value: Notification;
    onClose: (notificationId: string) => void;
}

export function NotificationItem({ value, onClose }: NotificationItemProps) {
    const isSuccess = value.isSuccess();
    const isError = value.isError();

    const classes = classNames(
        'notifications__item',
        isSuccess && 'notifications__item--success',
        isError && 'notifications__item--error',
    );

    const handleClose = () => {
        onClose(value.id);
    };

    const handleAction = () => {
        if (value.action) {
            value.action.handler();
        }

        handleClose();
    };

    useEffect(() => {
        const timeoutId = setTimeout(handleClose, NOTIFICATION_CLEAR_TIMEOUT_MS);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [handleClose]);

    return (
        <div className={classes}>
            <div className="notifications__item-content">
                <div className="notifications__item-message">
                    {value.message}
                </div>
                {value.action && (
                    <button
                        className="notifications__item-action"
                        type="button"
                        onClick={handleAction}
                    >
                        {value.action.action}
                    </button>
                )}
            </div>
            <IconButton name="cross" onClick={handleClose} />
        </div>
    );
}
