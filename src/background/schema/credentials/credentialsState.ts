import zod from 'zod';

export const credentialsStateScheme = zod.object({
    vpnToken: zod.any().optional(),
    vpnCredentials: zod.any().optional(),
    currentUsername: zod.string().or(zod.null()).optional(),
}).strict();

export type CredentialsState = zod.infer<typeof credentialsStateScheme>;
