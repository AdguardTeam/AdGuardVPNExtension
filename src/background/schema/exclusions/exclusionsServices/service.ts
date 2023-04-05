import zod from 'zod';

const serviceCategoryScheme = zod.object({
    id: zod.string(),
    name: zod.string(),
}).strict();

export type ServiceCategory = zod.infer<typeof serviceCategoryScheme>;

export const serviceScheme = zod.object({
    serviceId: zod.string(),
    serviceName: zod.string(),
    iconUrl: zod.string(),
    modifiedTime: zod.string(),
    categories: serviceCategoryScheme.array(),
    domains: zod.string().array(),
}).strict();

export type ServiceInterface = zod.infer<typeof serviceScheme>;
