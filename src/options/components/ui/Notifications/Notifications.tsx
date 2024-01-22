import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';

import { NotificationUi } from './NotificationUi';

import './notifications.pcss';

export const Notifications = observer(() => {
    const { notificationsStore } = useContext(rootStore);
    const { notifications } = notificationsStore;

    return (
        <div className="notifications">
            {notifications.map((notification) => {
                return <NotificationUi key={notification.id} notification={notification} />;
            })}
        </div>
    );
});
