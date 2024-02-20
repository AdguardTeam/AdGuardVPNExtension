import zod from 'zod';

export const logsValidator = zod.array(zod.string()).default([]);

/**
 * Describes logs format
 */
export type Logs = zod.infer<typeof logsValidator>;
