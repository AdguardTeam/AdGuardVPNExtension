import zod from 'zod';

import { endpointInterfaceScheme } from '../endpoints';
import { ACCESS_CREDENTIALS_DEFAULTS, accessCredentialsScheme } from './accessCredentials';
import { proxyConfigInterfaceScheme } from './proxyConfigInterface';

export const proxyStateScheme = zod.object({
    isActive: zod.boolean(),
    bypassList: zod.string().array(),
    endpointsTldExclusions: zod.string().array(),
    currentEndpoint: endpointInterfaceScheme.or(zod.null()),
    currentHost: zod.string(),
    currentConfig: proxyConfigInterfaceScheme.optional(),
    // FIXME: check if is optional
    inverted: zod.boolean().optional(),
    credentials: accessCredentialsScheme,
});

export type ProxyState = zod.infer<typeof proxyStateScheme>;

export const PROXY_DEFAULTS: ProxyState = {
    isActive: false,
    bypassList: [],
    endpointsTldExclusions: [],
    currentEndpoint: null,
    currentHost: '',
    credentials: ACCESS_CREDENTIALS_DEFAULTS,
};
