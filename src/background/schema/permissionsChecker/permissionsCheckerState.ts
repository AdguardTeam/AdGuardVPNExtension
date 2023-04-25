import zod from 'zod';

export const permissionsCheckerStateScheme = zod.object({
    credentialsCheckTimerId: zod.number().or(zod.null()),
    vpnInfoCheckTimerId: zod.number().or(zod.null()),
    expiredCredentialsCheckTimeoutId: zod.number().or(zod.null()),
}).strict();

export type PermissionsCheckerState = zod.infer<typeof permissionsCheckerStateScheme>;

export const PERMISSIONS_CHECKER_DEFAULTS: PermissionsCheckerState = {
    credentialsCheckTimerId: null,
    vpnInfoCheckTimerId: null,
    expiredCredentialsCheckTimeoutId: null,
};
