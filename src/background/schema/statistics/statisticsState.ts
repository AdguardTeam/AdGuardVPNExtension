import zod from 'zod';

export const statisticsStateScheme = zod.object({
    isConnected: zod.boolean(),
    isPremiumToken: zod.boolean(),
    locationId: zod.string().nullable(),
    accountId: zod.string().nullable(),
});

export type StatisticsState = zod.infer<typeof statisticsStateScheme>;

export const STATISTICS_STATE_DEFAULTS: StatisticsState = {
    isConnected: false,
    isPremiumToken: false,
    locationId: null,
    accountId: null,
};
