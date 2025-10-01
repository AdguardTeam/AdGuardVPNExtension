import { Notification } from './Notification';

export class SuccessNotification extends Notification {
    isError(): boolean {
        return false;
    }

    isSuccess(): boolean {
        return true;
    }
}
