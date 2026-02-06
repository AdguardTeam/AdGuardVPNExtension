import * as v from 'valibot';

export const fallbackInfoScheme = v.strictObject({
    vpnApiUrl: v.string(),
    authApiUrl: v.string(),
    forwarderApiUrl: v.string(),
    expiresInMs: v.number(),
});

export type FallbackInfo = v.InferOutput<typeof fallbackInfoScheme>;
