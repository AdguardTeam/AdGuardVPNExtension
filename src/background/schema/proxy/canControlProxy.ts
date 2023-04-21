import zod from 'zod';

export const canControlProxyScheme = zod.object({
    canControlProxy: zod.boolean(),
    cause: zod.string().optional(),
}).strict();

export type CanControlProxy = zod.infer<typeof canControlProxyScheme>;
