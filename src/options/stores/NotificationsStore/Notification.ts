import { ReactNode } from 'react';

import { nanoid } from 'nanoid';

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

    isError(): boolean {
        throw new Error('Not defined yet');
    }

    isSuccess(): boolean {
        throw new Error('Not defined yet');
    }
}
