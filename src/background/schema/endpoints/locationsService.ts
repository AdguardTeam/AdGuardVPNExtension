import * as v from 'valibot';

import { locationScheme } from './location';
import { pingsCacheScheme } from './pingsCache';

export const locationsServiceStateScheme = v.object({
    pingsCache: pingsCacheScheme,
    locations: v.array(locationScheme),
    selectedLocation: v.nullable(locationScheme),
});

export type LocationsServiceState = v.InferOutput<typeof locationsServiceStateScheme>;

export const LOCATIONS_SERVICE_STATE_DEFAULTS = {
    pingsCache: {},
    locations: [],
    selectedLocation: null,
};
