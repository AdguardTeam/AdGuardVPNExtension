import { Notification } from './Notification';

export class ErrorNotification extends Notification {
    public isError(): boolean {
        return true;
    }

    public isSuccess(): boolean {
        return false;
    }
}
