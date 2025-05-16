import { browserApi } from '../browserApi';
import { stateStorage } from '../stateStorage';
import { credentials } from '../credentials';

import { StatisticsStorage } from './StatisticsStorage';
import { StatisticsProvider } from './StatisticsProvider';

const statisticsStorage = new StatisticsStorage({
    storage: browserApi.storage,
});

export const statisticsProvider = new StatisticsProvider({
    stateStorage,
    statisticsStorage,
    credentials,
});
