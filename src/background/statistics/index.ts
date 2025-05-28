import { browserApi } from '../browserApi';
import { credentials } from '../credentials';
import { timers } from '../timers';

import { StatisticsStorage } from './StatisticsStorage';
import { StatisticsProvider } from './StatisticsProvider';

const statisticsStorage = new StatisticsStorage({
    storage: browserApi.storage,
});

export const statisticsProvider = new StatisticsProvider({
    statisticsStorage,
    credentials,
    timers,
});
