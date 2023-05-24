import zod from 'zod';

import { endpointInterfaceScheme } from './endpointInterface';

export const pingDataScheme = zod.object({
    ping: zod.number().or(zod.null()),
    available: zod.boolean(),
    lastMeasurementTime: zod.number(),
    endpoint: endpointInterfaceScheme.or(zod.null()),
    isMeasuring: zod.boolean(),
});

export const pingsCacheScheme = zod.record(zod.string(), pingDataScheme);

export type PingsCacheInterface = zod.infer<typeof pingsCacheScheme>;
