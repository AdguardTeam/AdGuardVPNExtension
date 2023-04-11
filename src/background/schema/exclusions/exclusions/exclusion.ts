import zod from 'zod';
import { ExclusionState } from '../../../../common/exclusionsConstants';

const exclusionState = zod.enum([ExclusionState.Enabled, ExclusionState.Disabled]);

export const exclusionScheme = zod.object({
    id: zod.string(),
    hostname: zod.string(),
    state: exclusionState,
});

export type ExclusionInterface = zod.infer<typeof exclusionScheme>;
