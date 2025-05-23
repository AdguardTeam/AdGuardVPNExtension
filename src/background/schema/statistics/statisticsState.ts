import zod from 'zod';

/**
 * Schema for the statistics state.
 */
export const statisticsStateScheme = zod.object({
    isPremiumToken: zod.boolean(),
    locationId: zod.string().nullable(),
    accountId: zod.string().nullable(),
    durationIntervalId: zod.number().nullable(),
});

/**
 * Type for the statistics state.
 */
export type StatisticsState = zod.infer<typeof statisticsStateScheme>;

/**
 * Default values for the statistics state.
 */
export const STATISTICS_STATE_DEFAULTS: StatisticsState = {
    isPremiumToken: false,
    locationId: null,
    accountId: null,
    durationIntervalId: null,
};
