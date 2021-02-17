import { Notification } from './Notification';

export class ErrorNotification extends Notification {
    isError() {
        return true;
    }

    isSuccess() {
        return false;
    }
}
