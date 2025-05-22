import { browserApi } from '../browserApi';
import { stateStorage } from '../stateStorage';
import { credentials } from '../credentials';
import { timers } from '../timers';

import { StatisticsStorage } from './StatisticsStorage';
import { StatisticsProvider } from './StatisticsProvider';
import { StatisticsService } from './StatisticsService';

const statisticsStorage = new StatisticsStorage({
    storage: browserApi.storage,
});

const statisticsProvider = new StatisticsProvider({
    stateStorage,
    statisticsStorage,
    credentials,
    timers,
});

export const statisticsService = new StatisticsService({
    storage: browserApi.storage,
    provider: statisticsProvider,
    credentials,
});
