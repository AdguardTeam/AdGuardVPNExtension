import { LocationWithPing } from '../../background/endpoints/LocationWithPing';

export enum RequestStatus {
    Done = 'done',
    Pending = 'pending',
    Error = 'error',
}

export const MAX_GET_POPUP_DATA_ATTEMPTS = 5;

export enum InputType {
    Text = 'text',
    Password = 'password',
}

export const PING_WITH_WARNING = 150;
