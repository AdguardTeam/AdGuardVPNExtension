import * as v from 'valibot';

export const permissionsCheckerStateScheme = v.strictObject({
    credentialsCheckTimerId: v.nullable(v.number()),
    vpnInfoCheckTimerId: v.nullable(v.number()),
    expiredCredentialsCheckTimeoutId: v.nullable(v.number()),
});

export type PermissionsCheckerState = v.InferOutput<typeof permissionsCheckerStateScheme>;

export const PERMISSIONS_CHECKER_DEFAULTS: PermissionsCheckerState = {
    credentialsCheckTimerId: null,
    vpnInfoCheckTimerId: null,
    expiredCredentialsCheckTimeoutId: null,
};
