import * as v from 'valibot';

import { endpointInterfaceScheme } from './endpointInterface';

export const locationDataScheme = v.object({
    id: v.string(),
    countryName: v.string(),
    cityName: v.string(),
    countryCode: v.string(),
    endpoints: v.array(endpointInterfaceScheme),
    coordinates: v.tuple([v.number(), v.number()]),
    premiumOnly: v.boolean(),
    pingBonus: v.number(),
    virtual: v.boolean(),
    // AG-49612: Backend now provides ping and availability data
    ping: v.nullable(v.number()),
    available: v.boolean(),
});

export type LocationData = v.InferOutput<typeof locationDataScheme>;

// AG-49612: Removed ping and available from locationInterfaceScheme
// as they now come from the API via locationDataScheme
export const locationInterfaceScheme = v.object({
    endpoint: v.optional(v.nullable(endpointInterfaceScheme)),
});

export const locationScheme = v.object({
    ...locationDataScheme.entries,
    ...locationInterfaceScheme.entries,
});

export type LocationInterface = v.InferOutput<typeof locationScheme>;
