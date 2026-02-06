import * as v from 'valibot';

import { ExclusionsMode } from '../../../common/exclusionsConstants';

import { exclusionScheme } from './exclusions/exclusion';

export const persistedExclusionsScheme = v.strictObject({
    [ExclusionsMode.Regular]: v.array(exclusionScheme),
    [ExclusionsMode.Selective]: v.array(exclusionScheme),
    inverted: v.boolean(),
});

export type PersistedExclusions = v.InferOutput<typeof persistedExclusionsScheme>;

export const exclusionsStateScheme = v.strictObject({
    previousExclusions: v.nullable(v.omit(persistedExclusionsScheme, ['inverted'])),
});

export type ExclusionsState = v.InferOutput<typeof exclusionsStateScheme>;

export const EXCLUSIONS_STATE_DEFAULTS: ExclusionsState = {
    previousExclusions: null,
};
