import * as v from 'valibot';

import { accessCredentialsScheme } from './accessCredentials';

export const hostCredentialsRepositoryScheme = v.record(v.string(), v.optional(accessCredentialsScheme));

export type HostCredentialsRepository = v.InferOutput<typeof hostCredentialsRepositoryScheme>;

export const DEFAULT_HOST_CREDENTIALS_REPOSITORY: HostCredentialsRepository = {};
