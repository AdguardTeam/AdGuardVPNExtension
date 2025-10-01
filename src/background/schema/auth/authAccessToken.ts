import zod from 'zod';

export const authAccessTokenScheme = zod.object({
    accessToken: zod.string(),
    expiresIn: zod.number().gte(0).finite(),
    tokenType: zod.literal('bearer'),
    scope: zod.literal('trust').optional(),
});

/**
 * Auth access token example:
 * {
 *  "accessToken":"9f8duv8dfv",
 *  "tokenType":"bearer",
 *  "expiresIn":2627940,
 *  "scope":"trust"
 * }
 */
export type AuthAccessToken = zod.infer<typeof authAccessTokenScheme>;
