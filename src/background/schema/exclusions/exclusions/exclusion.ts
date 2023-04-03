import zod from 'zod';
import { ExclusionState } from '../../../../common/exclusionsConstants';

export const exclusionScheme = zod.object({
    id: zod.string(),
    hostname: zod.string(),
    state: zod.nativeEnum(ExclusionState), // FIXME: exclude ExclusionState.PartlyEnabled
});

export type ExclusionInterface = zod.infer<typeof exclusionScheme>;
