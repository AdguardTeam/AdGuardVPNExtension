import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { useElementRect } from '../../hooks/useElementRect';

import { NotificationItem } from './NotificationItem';

import './notifications.pcss';

export const Notifications = observer(() => {
    const ref = useRef<HTMLDivElement>(null);
    const { notificationsStore } = useContext(rootStore);
    const { notifications } = notificationsStore;
    const firstThreeNotifications = notifications.slice(0, 3);

    const handleClose = (id: string) => {
        notificationsStore.removeNotification(id);
    };

    useElementRect(ref, 'notifications', true, true);

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
