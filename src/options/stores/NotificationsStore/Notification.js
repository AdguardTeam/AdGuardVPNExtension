import { nanoid } from 'nanoid';

export class Notification {
    constructor(message) {
        this.id = nanoid();
        this.notificationMessage = message;
    }

    get message() {
        return this.notificationMessage;
    }

    isError() {
        throw new Error('Not defined yet');
    }

    isSuccess() {
        throw new Error('Not defined yet');
    }
}
