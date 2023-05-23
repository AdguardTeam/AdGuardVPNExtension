import { init } from './initCommon';
import proxyApi from '../proxy/abstractProxyApi';

init.syncInitModules();

// register onAuthRequired listener on the top level
// to handle authorization for active proxy
proxyApi.init();

(async () => {
    await init.asyncInitModules();
})();
