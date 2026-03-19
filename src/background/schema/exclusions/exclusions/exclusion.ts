import * as v from 'valibot';

import { ExclusionState } from '../../../../common/exclusionsConstants';

const exclusionState = v.picklist([ExclusionState.Enabled, ExclusionState.Disabled]);

export const exclusionScheme = v.object({
    id: v.string(),
    hostname: v.string(),
    state: exclusionState,
});

export type ExclusionInterface = v.InferOutput<typeof exclusionScheme>;
