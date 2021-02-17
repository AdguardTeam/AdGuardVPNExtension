import { Notification } from './Notification';

export class SuccessNotification extends Notification {
    isError() {
        return false;
    }

    isSuccess() {
        return true;
    }
}
