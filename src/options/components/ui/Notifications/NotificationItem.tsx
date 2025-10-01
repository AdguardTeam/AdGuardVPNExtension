import React, { type ReactElement, useEffect, useState } from 'react';

import classNames from 'classnames';

import { Icon, IconButton } from '../../../../common/components/Icons';
import { type Notification } from '../../../stores/NotificationsStore/Notification';

/**
 * Notification show duration in milliseconds.
 */
const NOTIFICATION_TTL_MS = 5 * 1000; // 5s

/**
 * Notification close animation duration in milliseconds.
 */
const NOTIFICATION_CLOSE_ANIMATION_MS = 300; // 0.3s

/**
 * NotificationItem component props.
 */
export interface NotificationItemProps {
    /**
     * Notification to display.
     */
    value: Notification;

    /**
     * Close event handler.
     */
    onClose: (notificationId: string) => void;
}

/**
 * NotificationItem component.
 */
export function NotificationItem({ value, onClose }: NotificationItemProps): ReactElement {
    const [notificationIsClosed, setNotificationIsClosed] = useState(false);
    const [shouldCloseOnTimeout, setShouldCloseOnTimeout] = useState(true);

    const isSuccess = value.isSuccess();

    const classes = classNames(
        'notifications__item',
        isSuccess ? 'notifications__item--success' : 'notifications__item--error',
        notificationIsClosed && 'notifications__item--closed',
    );

    const handleMouseOver = (): void => {
        setShouldCloseOnTimeout(false);
    };

    const handleMouseOut = (): void => {
        setShouldCloseOnTimeout(true);
    };

    const handleRemove = (): void => {
        onClose(value.id);
    };

    const handleClose = (): void => {
        setNotificationIsClosed(true);
        const removeTimeoutId = setTimeout(() => {
            handleRemove();
            clearTimeout(removeTimeoutId);
        }, NOTIFICATION_CLOSE_ANIMATION_MS);
    };

    const handleAction = (): void => {
        if (value.action) {
            value.action.handler();
        }

        handleClose();
    };

    useEffect(() => {
        const closeTimeoutId = setTimeout((): void => {
            if (shouldCloseOnTimeout) {
                setNotificationIsClosed(true);
            }
        }, NOTIFICATION_TTL_MS);

        const removeTimeoutId = setTimeout((): void => {
            if (shouldCloseOnTimeout) {
                handleRemove();
            }
        }, NOTIFICATION_TTL_MS + NOTIFICATION_CLOSE_ANIMATION_MS);

        return (): void => {
            clearTimeout(closeTimeoutId);
            clearTimeout(removeTimeoutId);
        };
    }, [shouldCloseOnTimeout]);

    return (
        // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
        <div className={classes} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
            <Icon name="info" className="notifications__item-icon" />
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
