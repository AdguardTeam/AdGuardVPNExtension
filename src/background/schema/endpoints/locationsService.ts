import zod from 'zod';
import { locationScheme } from './location';

export const locationsServiceStateScheme = zod.object({
    locations: locationScheme.array(),
    selectedLocation: locationScheme.or(zod.null()),
});

export type LocationsServiceState = zod.infer<typeof locationsServiceStateScheme>;

export const LOCATIONS_SERVICE_STATE_DEFAULTS = {
    locations: [],
    selectedLocation: null,
};
