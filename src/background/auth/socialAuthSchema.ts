import { z } from 'zod';

/**
 * This is a schema for the data that is returned from the social auth endpoint.
 */
const socialAuthUnderScoreSchema = z.object({
    access_token: z.string(),
    expires_in: z.union([z.string().transform(Number), z.number()]),
    token_type: z.string(),
    state: z.string(),
});

/**
 * This is a schema for the data that is returned from the social auth endpoint after transforming the keys.
 */
export const socialAuthSchema = socialAuthUnderScoreSchema.transform((data) => ({
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    state: data.state,
}));

export type SocialAuthData = z.infer<typeof socialAuthSchema>;
