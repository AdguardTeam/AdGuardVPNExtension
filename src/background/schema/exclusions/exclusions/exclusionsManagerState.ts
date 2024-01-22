import zod from 'zod';

import { ExclusionsMode } from '../../../../common/exclusionsConstants';

import { exclusionScheme } from './exclusion';

export const persistedExclusionsScheme = zod.object({
    [ExclusionsMode.Regular]: exclusionScheme.array(),
    [ExclusionsMode.Selective]: exclusionScheme.array(),
    inverted: zod.boolean(),
}).strict();

export type PersistedExclusions = zod.infer<typeof persistedExclusionsScheme>;

const PERSISTED_EXCLUSIONS_DEFAULTS: PersistedExclusions = {
    [ExclusionsMode.Regular]: [],
    [ExclusionsMode.Selective]: [],
    inverted: false,
};

export const exclusionsManagerStateScheme = zod.object({
    exclusions: persistedExclusionsScheme,
    inverted: zod.boolean(),
    currentHandler: zod.any().optional(),
}).strict();

export type ExclusionsManagerState = zod.infer<typeof exclusionsManagerStateScheme>;

export const EXCLUSIONS_MANAGER_STATE_DEFAULTS: ExclusionsManagerState = {
    exclusions: PERSISTED_EXCLUSIONS_DEFAULTS,
    inverted: PERSISTED_EXCLUSIONS_DEFAULTS.inverted,
};
