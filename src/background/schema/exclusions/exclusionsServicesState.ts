import zod from 'zod';

export const exclusionsServicesScheme = zod.object({
    lastUpdateTimeMs: zod.number().or(zod.null()),
}).strict();

export type ExclusionsServicesState = zod.infer<typeof exclusionsServicesScheme>;

export const EXCLUSIONS_SERVICES_STATE_DEFAULTS: ExclusionsServicesState = {
    lastUpdateTimeMs: null,
};
