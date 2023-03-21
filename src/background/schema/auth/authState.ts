import zod from 'zod';

import { authAccessTokenScheme } from './authAccessToken';

export const authStateScheme = zod.object({
    socialAuthState: zod.string().or(zod.null()),
    accessTokenData: authAccessTokenScheme.or(zod.null()),
});
