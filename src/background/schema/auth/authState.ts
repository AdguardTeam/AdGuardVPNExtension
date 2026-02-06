import * as v from 'valibot';

import { authAccessTokenScheme } from './authAccessToken';

export const authStateScheme = v.object({
    accessTokenData: v.nullable(authAccessTokenScheme),
});

export type AuthState = v.InferOutput<typeof authStateScheme>;

export const AUTH_STATE_DEFAULTS: AuthState = {
    accessTokenData: null,
};
