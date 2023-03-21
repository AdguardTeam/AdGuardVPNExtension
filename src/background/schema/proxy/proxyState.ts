import zod from 'zod';

import { endpointInterfaceScheme } from '../endpoints';
import { accessCredentialsScheme } from './accessCredentials';
import { proxyConfigInterfaceScheme } from './proxyConfigInterface';

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
