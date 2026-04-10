import { Notification } from './Notification';

export class SuccessNotification extends Notification {
    public isError(): boolean {
        return false;
    }

    public isSuccess(): boolean {
        return true;
    }
}
