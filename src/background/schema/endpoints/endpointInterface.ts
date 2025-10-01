import zod from 'zod';

// TODO: advanced validators for ip and domains
export const endpointInterfaceScheme = zod.object({
    id: zod.string(),
    ipv4Address: zod.string(),
    ipv6Address: zod.string().nullable(),
    domainName: zod.string(),
    publicKey: zod.string(),
}).strict();

export type EndpointInterface = zod.infer<typeof endpointInterfaceScheme>;
