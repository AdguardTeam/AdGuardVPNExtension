import * as v from 'valibot';

const serviceCategoryScheme = v.strictObject({
    id: v.string(),
    name: v.string(),
});

export type ServiceCategory = v.InferOutput<typeof serviceCategoryScheme>;

export const serviceScheme = v.strictObject({
    serviceId: v.string(),
    serviceName: v.string(),
    iconUrl: v.string(),
    modifiedTime: v.string(),
    categories: v.array(serviceCategoryScheme),
    domains: v.array(v.string()),
});

export type ServiceInterface = v.InferOutput<typeof serviceScheme>;
