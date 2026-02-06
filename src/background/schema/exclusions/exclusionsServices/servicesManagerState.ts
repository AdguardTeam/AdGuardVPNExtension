import * as v from 'valibot';

import { serviceScheme } from './service';

const servicesScheme = v.record(v.string(), serviceScheme);

export type ServicesInterface = v.InferOutput<typeof servicesScheme>;

const servicesIndexScheme = v.record(v.string(), v.string());

export type ServicesIndexType = v.InferOutput<typeof servicesIndexScheme>;

export const exclusionsServicesManagerScheme = v.strictObject({
    lastUpdateTimeMs: v.nullable(v.number()),
    services: v.nullable(servicesScheme),
    servicesIndex: servicesIndexScheme,
});

export type ServicesManagerState = v.InferOutput<typeof exclusionsServicesManagerScheme>;

export const SERVICES_DEFAULTS: ServicesManagerState = {
    lastUpdateTimeMs: null,
    services: null,
    servicesIndex: {},
};
