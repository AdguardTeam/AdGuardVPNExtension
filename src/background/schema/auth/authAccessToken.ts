import * as v from 'valibot';

export const authAccessTokenScheme = v.object({
    accessToken: v.string(),
    expiresIn: v.pipe(v.number(), v.minValue(0), v.finite()),
    tokenType: v.literal('bearer'),
    scope: v.optional(v.literal('trust')),
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
export type AuthAccessToken = v.InferOutput<typeof authAccessTokenScheme>;
