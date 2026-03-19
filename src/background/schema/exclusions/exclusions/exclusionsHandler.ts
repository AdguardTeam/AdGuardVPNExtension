import * as v from 'valibot';

import { exclusionScheme } from './exclusion';

const exclusionsIndexScheme = v.record(v.string(), v.array(v.string()));

export type IndexedExclusionsInterface = v.InferOutput<typeof exclusionsIndexScheme>;

export const exclusionsHandlerStateScheme = v.strictObject({
    exclusions: v.array(exclusionScheme),
    exclusionsIndex: exclusionsIndexScheme,
});

export type ExclusionsHandlerState = v.InferOutput<typeof exclusionsHandlerStateScheme>;
