import zod from 'zod';

import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { exclusionScheme } from './exclusion';
import {
    EXCLUSIONS_HANDLER_STATE_DEFAULTS,
    exclusionsHandlerStateScheme,
} from './exclusionsHandler';

export const persistedExclusionsScheme = zod.object({
    [ExclusionsMode.Regular]: exclusionScheme.array(),
    [ExclusionsMode.Selective]: exclusionScheme.array(),
    inverted: zod.boolean(),
}).strict();

export type PersistedExclusions = zod.infer<typeof persistedExclusionsScheme>;

const DEFAULTS: PersistedExclusions = {
    [ExclusionsMode.Regular]: [],
    [ExclusionsMode.Selective]: [],
    inverted: false,
};

export const exclusionsScheme = zod.object({
    exclusions: persistedExclusionsScheme,
    inverted: zod.boolean(),
    currentHandler: exclusionsHandlerStateScheme,
}).strict();

type ExclusionsManagerType = zod.infer<typeof exclusionsScheme>;

export const EXCLUSIONS_DEFAULTS: ExclusionsManagerType = {
    exclusions: DEFAULTS,
    inverted: DEFAULTS.inverted,
    currentHandler: EXCLUSIONS_HANDLER_STATE_DEFAULTS,
};
