import zod from 'zod';

export const telemetryStateScheme = zod.object({
    syntheticId: zod.string().or(zod.null()),
}).strict();

export type TelemetryState = zod.infer<typeof telemetryStateScheme>;

export const TELEMETRY_STATE_DEFAULTS = {
    syntheticId: null,
};
