import * as v from 'valibot';

export const updateServiceStateScheme = v.strictObject({
    prevVersion: v.optional(v.string()),
    currentVersion: v.optional(v.string()),
});

export type UpdateServiceState = v.InferOutput<typeof updateServiceStateScheme>;
