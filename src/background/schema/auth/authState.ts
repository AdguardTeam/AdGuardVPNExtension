import zod from 'zod';

import { authAccessTokenScheme } from './authAccessToken';

export const authStateScheme = zod.object({
    accessTokenData: authAccessTokenScheme.or(zod.null()),
});

export type AuthState = zod.infer<typeof authStateScheme>;

export const AUTH_STATE_DEFAULTS: AuthState = {
    accessTokenData: null,
};
