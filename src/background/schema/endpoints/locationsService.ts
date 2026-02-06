import * as v from 'valibot';

import { locationScheme } from './location';

export const locationsServiceStateScheme = v.object({
    locations: v.array(locationScheme),
    selectedLocation: v.nullable(locationScheme),
});

export type LocationsServiceState = v.InferOutput<typeof locationsServiceStateScheme>;

export const LOCATIONS_SERVICE_STATE_DEFAULTS = {
    locations: [],
    selectedLocation: null,
};
