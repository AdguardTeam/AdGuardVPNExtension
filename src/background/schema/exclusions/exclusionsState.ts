import * as v from 'valibot';

import { ExclusionsMode } from '../../../common/exclusionsConstants';

import { exclusionScheme } from './exclusions/exclusion';

export const persistedExclusionsScheme = v.strictObject({
    [ExclusionsMode.Regular]: v.array(exclusionScheme),
    [ExclusionsMode.Selective]: v.array(exclusionScheme),
    inverted: v.boolean(),
});

export type PersistedExclusions = v.InferOutput<typeof persistedExclusionsScheme>;

/**
 * Schema for a single profile's exclusions snapshot (without the `inverted` flag).
 */
const exclusionsSnapshotScheme = v.omit(persistedExclusionsScheme, ['inverted']);

export const exclusionsStateScheme = v.strictObject({
    previousExclusionsMap: v.optional(
        v.record(v.string(), exclusionsSnapshotScheme),
    ),
});

export type ExclusionsState = v.InferOutput<typeof exclusionsStateScheme>;

export const EXCLUSIONS_STATE_DEFAULTS: ExclusionsState = {
    previousExclusionsMap: {},
};
