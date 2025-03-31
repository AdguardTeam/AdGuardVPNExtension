import { type ReactNode } from 'react';

import { observable, action } from 'mobx';

import type { RootStore } from '../RootStore';

import { SuccessNotification } from './SuccessNotification';
import { ErrorNotification } from './ErrorNotification';
import { type Action, type Notification } from './Notification';

/**
 * The maximum number of notifications that can be displayed at once.
 */
const MAX_NOTIFICATIONS_COUNT = 1;

export class NotificationsStore {
    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @observable notifications: Notification[] = [];

    @action addNotification = (notification: Notification) => {
        // Remove the oldest notification if there are already 1 notification.
        if (this.notifications.length === MAX_NOTIFICATIONS_COUNT) {
            this.notifications.shift();
        }
        this.notifications.push(notification);
    };

    @action removeNotification = (notificationId: string) => {
        this.notifications = this.notifications
            .filter((notification) => notification.id !== notificationId);
    };

    @action notifySuccess = (message: ReactNode, action?: Action) => {
        this.addNotification(new SuccessNotification(message, action));
    };

    @action notifyError = (message: ReactNode, action?: Action) => {
        this.addNotification(new ErrorNotification(message, action));
    };
}
