import zod from 'zod';

export const authAccessTokenScheme = zod.object({
    accessToken: zod.string(),
    expiresIn: zod.number(),
    tokenType: zod.string(),
    scope: zod.string().optional(),
});

/**
 * Auth access token example:
 * {
 *  "access_token":"9f8duv8dfv",
 *  "token_type":"bearer",
 *  "expires_in":2627940,
 *  "scope":"trust"
 * }
 */
export type AuthAccessToken = zod.infer<typeof authAccessTokenScheme>;
