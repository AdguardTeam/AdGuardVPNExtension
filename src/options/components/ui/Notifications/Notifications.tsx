import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';

import { NotificationItem } from './NotificationItem';

import './notifications.pcss';

export const Notifications = observer(() => {
    const { notificationsStore } = useContext(rootStore);
    const { notifications } = notificationsStore;

    const ref = useRef<HTMLDivElement>(null);

    const firstThreeNotifications = notifications.slice(0, 3);

    const handleClose = (notificationId: string) => {
        notificationsStore.removeNotification(notificationId);
    };

    return (
        <div ref={ref} className="notifications">
            {firstThreeNotifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    value={notification}
                    onClose={handleClose}
                />
            ))}
        </div>
    );
});
