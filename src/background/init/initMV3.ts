import { init } from './initCommon';
import proxyApi from '../proxy/abstractProxyApi';

// Init modules that must be invoked on the top level
// and adds adguard variables to the global scope
init.syncInitModules();

// register onAuthRequired listener on the top level
// to handle authorization for active proxy
proxyApi.init();

// Init all other modules
(async () => {
    await init.asyncInitModules();
})();
