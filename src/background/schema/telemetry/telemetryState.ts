import zod from 'zod';

import { TelemetryScreenName } from '../../telemetry';

export const telemetryStateScheme = zod.object({
    syntheticId: zod.string().or(zod.null()),
    prevScreenName: zod.nativeEnum(TelemetryScreenName).or(zod.null()),
    currentScreenName: zod.nativeEnum(TelemetryScreenName).or(zod.null()),
}).strict();

export type TelemetryState = zod.infer<typeof telemetryStateScheme>;

export const TELEMETRY_STATE_DEFAULTS = {
    syntheticId: null,
    prevScreenName: null,
    currentScreenName: null,
};
