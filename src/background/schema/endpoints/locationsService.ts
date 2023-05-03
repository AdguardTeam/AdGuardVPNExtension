import zod from 'zod';

import { locationScheme } from './location';
import { pingsCacheScheme } from './pingsCache';

export const locationsServiceStateScheme = zod.object({
    pingsCache: pingsCacheScheme,
    locations: locationScheme.array(),
    selectedLocation: locationScheme.or(zod.null()),
});

export type LocationsServiceState = zod.infer<typeof locationsServiceStateScheme>;

export const LOCATIONS_SERVICE_STATE_DEFAULTS = {
    pingsCache: {},
    locations: [],
    selectedLocation: null,
};
