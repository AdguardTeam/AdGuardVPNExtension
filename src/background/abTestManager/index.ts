import { ABTestManager } from './ABTestManager';
import { EXPERIMENT_REGISTRY } from './constants';

export const abTestManager = new ABTestManager(EXPERIMENT_REGISTRY);
