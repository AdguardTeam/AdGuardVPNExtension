import { type ReactNode } from 'react';

import { nanoid } from 'nanoid';

export interface Action {
    action: ReactNode | string,
    handler: () => void,
}

export class Notification {
    public id: string;

    public message: ReactNode | string;

    public action?: Action;

    constructor(message: ReactNode | string, action?: Action) {
        this.id = nanoid();
        this.message = message;
        this.action = action;
    }

    public isError(): boolean {
        throw new Error('Not defined yet');
    }

    public isSuccess(): boolean {
        throw new Error('Not defined yet');
    }
}
