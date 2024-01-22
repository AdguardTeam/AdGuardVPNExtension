import zod from 'zod';

import { accessCredentialsScheme } from './accessCredentials';

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
