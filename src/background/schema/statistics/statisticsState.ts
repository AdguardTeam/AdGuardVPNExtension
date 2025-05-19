import zod from 'zod';

export const statisticsStateScheme = zod.object({
    isPremiumToken: zod.boolean(),
    locationId: zod.string().nullable(),
    accountId: zod.string().nullable(),
    durationIntervalId: zod.number().nullable(),
});

export type StatisticsState = zod.infer<typeof statisticsStateScheme>;

export const STATISTICS_STATE_DEFAULTS: StatisticsState = {
    isPremiumToken: false,
    locationId: null,
    accountId: null,
    durationIntervalId: null,
};
