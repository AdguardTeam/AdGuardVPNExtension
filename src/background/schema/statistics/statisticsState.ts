import zod from 'zod';

import { StatisticsRange } from '../../statistics/statisticsTypes';

/**
 * Schema for statistics state.
 */
export const statisticsStateScheme = zod.object({
    range: zod.nativeEnum(StatisticsRange),
});

/**
 * Statistics state type infered from {@link statisticsStateScheme}.
 */
export type StatisticsState = zod.infer<typeof statisticsStateScheme>;

/**
 * Default statistics state.
 */
export const STATISTICS_STATE_DEFAULT: StatisticsState = {
    range: StatisticsRange.Days7,
};
