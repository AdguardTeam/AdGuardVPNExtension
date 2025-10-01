import zod from 'zod';

import { ExclusionsMode } from '../../../common/exclusionsConstants';

import { exclusionScheme } from './exclusions/exclusion';

export const persistedExclusionsScheme = zod.object({
    [ExclusionsMode.Regular]: exclusionScheme.array(),
    [ExclusionsMode.Selective]: exclusionScheme.array(),
    inverted: zod.boolean(),
}).strict();

export type PersistedExclusions = zod.infer<typeof persistedExclusionsScheme>;

export const exclusionsStateScheme = zod.object({
    previousExclusions: persistedExclusionsScheme.omit({ inverted: true }).or(zod.null()),
}).strict();

export type ExclusionsState = zod.infer<typeof exclusionsStateScheme>;

export const EXCLUSIONS_STATE_DEFAULTS: ExclusionsState = {
    previousExclusions: null,
};
