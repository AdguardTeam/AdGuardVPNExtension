import zod from 'zod';

export const updateServiceStateScheme = zod.object({
    prevVersion: zod.string().optional(),
    currentVersion: zod.string().optional(),
}).strict();

export type UpdateServiceState = zod.infer<typeof updateServiceStateScheme>;
