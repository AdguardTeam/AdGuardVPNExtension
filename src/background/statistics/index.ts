import { browserApi } from '../browserApi';
import { timers } from '../timers';
import { credentials } from '../credentials';

import { StatisticsStorage } from './StatisticsStorage';
import { StatisticsProvider } from './StatisticsProvider';
import { StatisticsService } from './StatisticsService';

const statisticsStorage = new StatisticsStorage({
    storage: browserApi.storage,
});

const statisticsProvider = new StatisticsProvider({
    storage: browserApi.storage,
    statisticsStorage,
    timers,
    credentials,
});

export const statisticsService = new StatisticsService({
    statisticsStorage,
    provider: statisticsProvider,
});
