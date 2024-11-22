import React, { useEffect } from 'react';

import classNames from 'classnames';

import { type Notification } from '../../stores/NotificationsStore/Notification';
import { Icon } from '../ui/Icon';

const NOTIFICATION_CLEAR_TIMEOUT_MS = 5 * 1000; // 5s

export interface NotificationItemProps {
    value: Notification;
    onClose: (id: string) => void;
}

export function NotificationItem({ value, onClose }: NotificationItemProps) {
    const isSuccess = value.isSuccess();
    const isError = value.isError();
    const classes = classNames(
        'notifications__item',
        isSuccess && 'notifications__item--success',
        isError && 'notifications__item--error',
    );

    const emitClose = () => {
        onClose(value.id);
    };

    const handleAction = (action: () => void) => () => {
        action();
        emitClose();
    };

    useEffect(() => {
        const timeoutId = setTimeout(emitClose, NOTIFICATION_CLEAR_TIMEOUT_MS);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [emitClose]);

    return (
        <div className={classes}>
            <div className="notifications__item-content">
                <div className="notifications__item-message">{value.message}</div>
                {value.action && (
                    <button
                        className="notifications__item-action"
                        type="button"
                        onClick={handleAction(value.action.handler)}
                    >
                        {value.action.action}
                    </button>
                )}
            </div>
            <button
                className="notifications__item-close-btn"
                type="button"
                onClick={emitClose}
            >
                <Icon name="cross" className="notifications__item-close-btn-icon" />
            </button>
        </div>
    );
}
