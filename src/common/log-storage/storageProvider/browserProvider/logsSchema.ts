import * as v from 'valibot';

export const logsValidator = v.optional(v.array(v.string()), () => []);

/**
 * Describes logs format
 */
export type Logs = v.InferOutput<typeof logsValidator>;
