import { Method } from 'axios';

export type AuthCredentials = {
    username: string;
    password: string;
    twoFactor: string;
    marketingConsent: boolean | null;
    locale: string;
    clientId: string;
    appId: string;

    /**
     * Optional email confirmation code.
     */
    code?: string;
};

export type RequestProps = {
    path: string;
    method: Method;
};
