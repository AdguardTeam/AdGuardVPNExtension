import zod from 'zod';

import { persistedExclusionsScheme } from './exclusions';

export const exclusionsStateScheme = zod.object({
    previousExclusions: persistedExclusionsScheme.or(zod.null()), // FIXME: Omit inverted exclusions
}).strict();

export type ExclusionsState = zod.infer<typeof exclusionsStateScheme>;

export const EXCLUSIONS_STATE_DEFAULTS: ExclusionsState = {
    previousExclusions: null,
};
