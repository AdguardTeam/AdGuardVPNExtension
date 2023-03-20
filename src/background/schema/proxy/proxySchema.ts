import zod from 'zod';

import { endpointInterfaceScheme } from '../endpoints';

export const accessCredentialsScheme = zod.object({
    username: zod.string(),
    password: zod.string(),
}).strict();

export type AccessCredentials = zod.infer<typeof accessCredentialsScheme>;

export const canControlProxyScheme = zod.object({
    canControlProxy: zod.boolean(),
    cause: zod.string().optional(),
}).strict();

export type CanControlProxy = zod.infer<typeof canControlProxyScheme>;

export const proxyConfigInterfaceScheme = zod.object({
    bypassList: zod.string().array(),
    defaultExclusions: zod.string().array(),
    nonRoutableCidrNets: zod.string().array(),
    host: zod.string(),
    port: zod.number(),
    scheme: zod.string(),
    inverted: zod.boolean(),
    credentials: accessCredentialsScheme,
}).strict();

export type ProxyConfigInterface = zod.infer<typeof proxyConfigInterfaceScheme>;

export const proxyStateScheme = zod.object({
    isActive: zod.boolean().optional(),
    bypassList: zod.string().array().optional(),
    endpointsTldExclusions: zod.string().array().optional(),
    currentEndpoint: endpointInterfaceScheme.or(zod.null()),
    currentHost: zod.string(),
    currentConfig: proxyConfigInterfaceScheme.optional(),
    // FIXME: check if is optional
    inverted: zod.boolean().optional(),
    credentials: accessCredentialsScheme.optional(),
});

export type ProxyState = zod.infer<typeof proxyStateScheme>;

export const PROXY_DEFAULTS: ProxyState = {
    isActive: false,
    bypassList: [],
    endpointsTldExclusions: [],
    currentEndpoint: null,
    currentHost: '',
};
