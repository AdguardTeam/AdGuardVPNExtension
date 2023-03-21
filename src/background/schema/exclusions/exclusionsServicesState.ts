import zod from 'zod';

export const exclusionsServicesScheme = zod.object({
    lastUpdateTimeMs: zod.number().or(zod.null()),
}).strict();

export type ExclusionsServicesState = zod.infer<typeof exclusionsServicesScheme>;
