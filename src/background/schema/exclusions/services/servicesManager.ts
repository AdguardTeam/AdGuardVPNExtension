import zod from 'zod';

import { serviceScheme } from './service';

const servicesScheme = zod.record(zod.string(), serviceScheme);

export type ServicesInterface = zod.infer<typeof servicesScheme>;

const servicesIndexScheme = zod.record(zod.string(), zod.string());

export type ServicesIndexType = zod.infer<typeof servicesIndexScheme>;

export const exclusionsServicesScheme = zod.object({
    lastUpdateTimeMs: zod.number().or(zod.null()),
    services: servicesScheme.or(zod.null()),
    servicesIndex: servicesIndexScheme,
}).strict();

type ServicesManagerType = zod.infer<typeof exclusionsServicesScheme>;

export const SERVICES_DEFAULTS: ServicesManagerType = {
    lastUpdateTimeMs: null,
    services: null,
    servicesIndex: {},
};
