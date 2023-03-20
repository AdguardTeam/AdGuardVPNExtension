import zod from 'zod';
import { vpnTokenDataScheme } from './vpnTokenData';

export const credentialsStateScheme = zod.object({
    vpnToken: vpnTokenDataScheme.optional(),
    // FIXME: remove any
    vpnCredentials: zod.any().optional(),
    currentUsername: zod.string().or(zod.null()).optional(),
    appId: zod.string().optional(),
}).strict();

export type CredentialsState = zod.infer<typeof credentialsStateScheme>;
