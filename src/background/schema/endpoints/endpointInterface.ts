import * as v from 'valibot';

// TODO: advanced validators for ip and domains
export const endpointInterfaceScheme = v.strictObject({
    id: v.string(),
    ipv4Address: v.string(),
    ipv6Address: v.nullable(v.string()),
    domainName: v.string(),
    publicKey: v.string(),
});

export type EndpointInterface = v.InferOutput<typeof endpointInterfaceScheme>;
