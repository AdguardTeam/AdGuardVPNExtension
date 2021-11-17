import browserApi from '../browserApi';
import ExclusionsManager from './ExclusionsManager';
import { proxy } from '../proxy';
import { settings } from '../settings';

const exclusions = new ExclusionsManager(browserApi, proxy, settings);

export default exclusions;

// eslint-disable-next-line import/named
export { ExclusionsHandler } from './ExclusionsHandler';

export { servicesManager } from './ServicesManager';
