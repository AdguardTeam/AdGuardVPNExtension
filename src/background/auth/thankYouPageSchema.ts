import { z } from 'zod';

const stringToBoolTransformer = z.string().transform((value) => value.toLowerCase() === 'true');

export const thankYouPageSchema = z.object({
    token: z.string(),
    redirectUrl: z.string(),
    newUser: z.boolean().or(stringToBoolTransformer).transform((value) => Boolean(value)),
});

export type ThankYouPageData = z.infer<typeof thankYouPageSchema>;
