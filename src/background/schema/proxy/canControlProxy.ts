import * as v from 'valibot';

export const canControlProxyScheme = v.strictObject({
    canControlProxy: v.boolean(),
    cause: v.optional(v.string()),
});

export type CanControlProxy = v.InferOutput<typeof canControlProxyScheme>;
