import zod from 'zod';

export const countryInfoScheme = zod.object({
    country: zod.string(),
    bkp: zod.boolean(),
}).strict();

export type CountryInfo = zod.infer<typeof countryInfoScheme>;

export const fallbackInfoScheme = zod.object({
    vpnApiUrl: zod.string(),
    authApiUrl: zod.string(),
    countryInfo: countryInfoScheme,
    expiresInMs: zod.number(),
}).strict();

export type FallbackInfo = zod.infer<typeof fallbackInfoScheme>;
