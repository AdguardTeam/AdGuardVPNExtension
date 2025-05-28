import { browserApi } from '../browserApi';
import { timers } from '../timers';

import { StatisticsStorage } from './StatisticsStorage';
import { StatisticsProvider } from './StatisticsProvider';
import { StatisticsService } from './StatisticsService';

const statisticsStorage = new StatisticsStorage({
    storage: browserApi.storage,
});

const statisticsProvider = new StatisticsProvider({
    statisticsStorage,
    timers,
});

export const statisticsService = new StatisticsService({
    storage: browserApi.storage,
    statisticsStorage,
    provider: statisticsProvider,
});
