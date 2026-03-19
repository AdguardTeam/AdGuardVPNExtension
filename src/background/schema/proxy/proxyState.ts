import * as v from 'valibot';

import { endpointInterfaceScheme } from '../endpoints';

import { ACCESS_CREDENTIALS_DEFAULTS, accessCredentialsScheme } from './accessCredentials';
import { proxyConfigInterfaceScheme } from './proxyConfigInterface';

export const proxyStateScheme = v.object({
    isActive: v.boolean(),
    bypassList: v.array(v.string()),
    endpointsTldExclusions: v.array(v.string()),
    currentEndpoint: v.nullable(endpointInterfaceScheme),
    currentHost: v.string(),
    currentConfig: v.optional(proxyConfigInterfaceScheme),
    inverted: v.boolean(),
    credentials: accessCredentialsScheme,
});

export type ProxyState = v.InferOutput<typeof proxyStateScheme>;

export const PROXY_DEFAULTS: ProxyState = {
    isActive: false,
    bypassList: [],
    endpointsTldExclusions: [],
    currentEndpoint: null,
    currentHost: '',
    inverted: false,
    credentials: ACCESS_CREDENTIALS_DEFAULTS,
};
