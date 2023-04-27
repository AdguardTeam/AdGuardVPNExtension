import zod from 'zod';
import { locationInterfaceScheme } from './location';

export const locationsServiceStateScheme = zod.object({
    locations: locationInterfaceScheme.array(),
    selectedLocation: locationInterfaceScheme.or(zod.null()),
});

export type LocationsServiceState = zod.infer<typeof locationsServiceStateScheme>;

export const LOCATIONS_SERVICE_STATE_DEFAULTS = {
    locations: [],
    selectedLocation: null,
};
