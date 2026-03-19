import * as v from 'valibot';

import { accessCredentialsScheme } from './accessCredentials';

export const proxyConfigInterfaceScheme = v.strictObject({
    bypassList: v.array(v.string()),
    defaultExclusions: v.array(v.string()),
    nonRoutableCidrNets: v.array(v.string()),
    host: v.string(),
    port: v.number(),
    scheme: v.string(),
    inverted: v.boolean(),
    credentials: accessCredentialsScheme,
});

export type ProxyConfigInterface = v.InferOutput<typeof proxyConfigInterfaceScheme>;
