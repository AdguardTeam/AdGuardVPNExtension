import zod from 'zod';

export const fallbackInfoScheme = zod.object({
    vpnApiUrl: zod.string(),
    authApiUrl: zod.string(),
    forwarderApiUrl: zod.string(),
    expiresInMs: zod.number(),
}).strict();

export type FallbackInfo = zod.infer<typeof fallbackInfoScheme>;
