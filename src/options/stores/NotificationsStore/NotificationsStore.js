import { observable, action } from 'mobx';
import { SuccessNotification } from './SuccessNotification';
import { ErrorNotification } from './ErrorNotification';

export class NotificationsStore {
    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @observable notifications = [];

    @action addNotification = (notification) => {
        this.notifications.push(notification);
    };

    @action removeNotification = (notificationId) => {
        this.notifications = this.notifications
            .filter((notification) => notification.id !== notificationId);
    };

    @action clearNotifications() {
        this.notifications = [];
    }

    notifySuccess = (message) => {
        this.clearNotifications();
        this.addNotification(new SuccessNotification(message));
    };

    notifyError = (message) => {
        this.clearNotifications();
        this.addNotification(new ErrorNotification(message));
    };
}
