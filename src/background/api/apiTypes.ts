import { Method } from 'axios';

export type AuthCredentials = {
    username: string;
    password: string;
    twoFactor: string;
    marketingConsent: boolean;
    locale: string;
    clientId: string;
    appId: string;
};

/**
 * Auth access token
 * e.g.
 * {
 *  "access_token":"lllllllllll",
 *  "token_type":"bearer",
 *  "expires_in":2627940,
 *  "scope":"trust"
 * }
 */
export type AuthAccessToken = {
    accessToken: string;
    expiresIn: number;
    tokenType: string;
    scope?: string;
};

export type RequestProps = {
    path: string;
    method: Method;
};
