import AppStatus from './AppStatus';
import proxy from '../proxy';
import settings from '../settings/settings';
import packageJson from '../../../package.json';

const appStatus = new AppStatus(proxy, settings, packageJson);

export default appStatus;
