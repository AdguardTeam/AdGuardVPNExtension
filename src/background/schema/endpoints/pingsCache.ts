import * as v from 'valibot';

import { endpointInterfaceScheme } from './endpointInterface';

export const pingDataScheme = v.object({
    ping: v.nullable(v.number()),
    available: v.boolean(),
    lastMeasurementTime: v.number(),
    endpoint: v.nullable(endpointInterfaceScheme),
    isMeasuring: v.boolean(),
});

export const pingsCacheScheme = v.record(v.string(), pingDataScheme);

export type PingsCacheInterface = v.InferOutput<typeof pingsCacheScheme>;
