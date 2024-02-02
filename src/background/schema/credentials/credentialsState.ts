import zod from 'zod';

import { vpnTokenDataScheme } from './vpnTokenData';

export const vpnCredentialsScheme = zod.object({
    licenseStatus: zod.string(),
    result: zod.object({
        credentials: zod.string(),
        expiresInSec: zod.number(),
    }),
    timeExpiresSec: zod.number(),
});

export type CredentialsDataInterface = zod.infer<typeof vpnCredentialsScheme>;

export const credentialsStateScheme = zod.object({
    vpnToken: vpnTokenDataScheme.or(zod.null()),
    vpnCredentials: vpnCredentialsScheme.or(zod.null()),
    currentUsername: zod.string().or(zod.null()),
    currentUserRegistrationTime: zod.string().or(zod.null()),
    appId: zod.string().or(zod.null()),
}).strict();

export type CredentialsState = zod.infer<typeof credentialsStateScheme>;

export const CREDENTIALS_STATE_DEFAULTS = {
    vpnToken: null,
    vpnCredentials: null,
    currentUsername: null,
    currentUserRegistrationTime: null,
    appId: null,
};
