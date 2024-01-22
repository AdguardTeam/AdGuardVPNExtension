import zod from 'zod';

import { exclusionScheme } from './exclusion';

const exclusionsIndexScheme = zod.record(zod.string(), zod.string().array());

export type IndexedExclusionsInterface = zod.infer<typeof exclusionsIndexScheme>;

export const exclusionsHandlerStateScheme = zod.object({
    exclusions: exclusionScheme.array(),
    exclusionsIndex: exclusionsIndexScheme,
}).strict();

export type ExclusionsHandlerState = zod.infer<typeof exclusionsHandlerStateScheme>;
