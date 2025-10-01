import zod from 'zod';

import { accessCredentialsScheme } from './accessCredentials';

export const hostCredentialsRepositoryScheme = zod.record(zod.string(), accessCredentialsScheme.or(zod.undefined()));

export type HostCredentialsRepository = zod.infer<typeof hostCredentialsRepositoryScheme>;

export const DEFAULT_HOST_CREDENTIALS_REPOSITORY: HostCredentialsRepository = {};
