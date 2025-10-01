import { Notification } from './Notification';

export class ErrorNotification extends Notification {
    isError(): boolean {
        return true;
    }

    isSuccess(): boolean {
        return false;
    }
}
