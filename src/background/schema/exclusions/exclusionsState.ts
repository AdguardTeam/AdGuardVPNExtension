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
export const exclusionsSnapshotScheme = v.omit(persistedExclusionsScheme, ['inverted']);

/**
 * Exclusions snapshot inferred from {@link exclusionsSnapshotScheme}.
 */
export type ExclusionsSnapshot = v.InferOutput<typeof exclusionsSnapshotScheme>;
