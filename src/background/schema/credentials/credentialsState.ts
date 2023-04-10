import zod from 'zod';
import { vpnTokenDataScheme } from './vpnTokenData';

export const credentialsStateScheme = zod.object({
    vpnToken: vpnTokenDataScheme.or(zod.null()),
    // FIXME: remove any
    vpnCredentials: zod.any().or(zod.null()),
    currentUsername: zod.string().or(zod.null()),
    appId: zod.string().or(zod.null()),
}).strict();

export type CredentialsState = zod.infer<typeof credentialsStateScheme>;

export const CREDENTIALS_STATE_DEFAULTS = {
    vpnToken: null,
    vpnCredentials: null,
    currentUsername: null,
    appId: null,
};
