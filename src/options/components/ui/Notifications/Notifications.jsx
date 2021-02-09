import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Notification } from './Notification';

import './notifications.pcss';

export const Notifications = observer(() => {
    const { notificationsStore } = useContext(rootStore);
    const { notifications } = notificationsStore;

    return (
        <div className="notifications">
            {notifications.map((notification) => {
                return <Notification key={notification.id} notification={notification} />;
            })}
        </div>
    )
});
