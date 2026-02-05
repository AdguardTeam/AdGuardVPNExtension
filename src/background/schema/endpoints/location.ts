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
    // AG-49612: Backend now provides ping and availability data
    ping: zod.number().or(zod.null()),
    available: zod.boolean(),
});

export type LocationData = zod.infer<typeof locationDataScheme>;

// AG-49612: Removed ping and available from locationInterfaceScheme
// as they now come from the API via locationDataScheme
export const locationInterfaceScheme = zod.object({
    endpoint: endpointInterfaceScheme.or(zod.null()).optional(),
});

export const locationScheme = locationDataScheme.merge(locationInterfaceScheme);

export type LocationInterface = zod.infer<typeof locationScheme>;
