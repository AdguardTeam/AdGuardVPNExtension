import zod from 'zod';
import { endpointInterfaceScheme } from './endpointInterface';

const coordinatesScheme = zod.object({
    longitude: zod.number(),
    latitude: zod.number(),
});

export const locationDataScheme = zod.object({
    id: zod.string(),
    countryName: zod.string(),
    cityName: zod.string(),
    countryCode: zod.string(),
    endpoints: endpointInterfaceScheme.array(),
    coordinates: coordinatesScheme.array(),
    premiumOnly: zod.boolean(),
    pingBonus: zod.number(),
    virtual: zod.boolean(),
});

export type LocationData = zod.infer<typeof locationDataScheme>;

export const locationInterfaceScheme = zod.object({
    available: zod.boolean(),
    ping: zod.number().or(zod.null()),
    endpoint: endpointInterfaceScheme.or(zod.null()),
});

const locationScheme = locationDataScheme.merge(locationInterfaceScheme);

export type LocationInterface = zod.infer<typeof locationScheme>;
