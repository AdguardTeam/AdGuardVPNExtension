import { nanoid } from 'nanoid';
import { ReactNode } from 'react';

export interface Action {
    action: ReactNode | string,
    handler: () => void,
}

export class Notification {
    id: string;

    message: ReactNode | string;

    action?: Action;

    constructor(message: ReactNode | string, action?: Action) {
        this.id = nanoid();
        this.message = message;
        this.action = action;
    }

    isError() {
        throw new Error('Not defined yet');
    }

    isSuccess() {
        throw new Error('Not defined yet');
    }
}
