import zod from 'zod';
import { endpointInterfaceScheme } from './endpointInterface';

export const locationDataScheme = zod.object({
    id: zod.string(),
    countryName: zod.string(),
    cityName: zod.string(),
    countryCode: zod.string(),
    endpoints: endpointInterfaceScheme.array(),
    coordinates: zod.tuple([zod.number(), zod.number()]),
    premiumOnly: zod.boolean(),
    pingBonus: zod.number(),
    virtual: zod.boolean(),
});

export type LocationData = zod.infer<typeof locationDataScheme>;

export const locationInterfaceScheme = zod.object({
    available: zod.boolean().optional(),
    ping: zod.number().or(zod.null()).optional(),
    endpoint: endpointInterfaceScheme.or(zod.null()).optional(),
});

export const locationScheme = locationDataScheme.merge(locationInterfaceScheme);

export type LocationInterface = zod.infer<typeof locationScheme>;
