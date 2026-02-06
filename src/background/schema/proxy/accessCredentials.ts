import * as v from 'valibot';

export const accessCredentialsScheme = v.strictObject({
    username: v.string(),
    password: v.string(),
});

export type AccessCredentials = v.InferOutput<typeof accessCredentialsScheme>;

export const ACCESS_CREDENTIALS_DEFAULTS: AccessCredentials = {
    username: '',
    password: '',
};
