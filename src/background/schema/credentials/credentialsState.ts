import * as v from 'valibot';

import { vpnTokenDataScheme } from './vpnTokenData';

export const vpnCredentialsScheme = v.object({
    licenseStatus: v.string(),
    result: v.object({
        credentials: v.string(),
        expiresInSec: v.number(),
    }),
    timeExpiresSec: v.number(),
});

export type CredentialsDataInterface = v.InferOutput<typeof vpnCredentialsScheme>;

export const credentialsStateScheme = v.strictObject({
    vpnToken: v.nullable(vpnTokenDataScheme),
    vpnCredentials: v.nullable(vpnCredentialsScheme),
    username: v.nullable(v.string()),
    registrationTime: v.nullable(v.string()),
    marketingConsent: v.nullable(v.boolean()),
    appId: v.nullable(v.string()),
});

export type CredentialsState = v.InferOutput<typeof credentialsStateScheme>;

export const CREDENTIALS_STATE_DEFAULTS = {
    vpnToken: null,
    vpnCredentials: null,
    username: null,
    registrationTime: null,
    marketingConsent: null,
    appId: null,
};
