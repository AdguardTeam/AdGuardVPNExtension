import zod from 'zod';

export const accessCredentialsScheme = zod.object({
    username: zod.string(),
    password: zod.string(),
}).strict();

export type AccessCredentials = zod.infer<typeof accessCredentialsScheme>;

export const ACCESS_CREDENTIALS_DEFAULTS: AccessCredentials = {
    username: '',
    password: '',
};
