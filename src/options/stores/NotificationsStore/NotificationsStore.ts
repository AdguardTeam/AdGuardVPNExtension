import { ReactNode } from 'react';

import { observable, action } from 'mobx';

import type { RootStore } from '../RootStore';

import { SuccessNotification } from './SuccessNotification';
import { ErrorNotification } from './ErrorNotification';
import { Action, Notification } from './Notification';

export class NotificationsStore {
    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @observable notifications: Notification[] = [];

    @action addNotification = (notification: Notification) => {
        this.notifications.push(notification);
    };

    @action removeNotification = (notificationId: string) => {
        this.notifications = this.notifications
            .filter((notification) => notification.id !== notificationId);
    };

    @action clearNotifications() {
        this.notifications = [];
    }

    notifySuccess = (message: ReactNode, action?: Action) => {
        this.clearNotifications();
        this.addNotification(new SuccessNotification(message, action));
    };

    notifyError = (message: ReactNode, action?: Action) => {
        this.clearNotifications();
        this.addNotification(new ErrorNotification(message, action));
    };
}
