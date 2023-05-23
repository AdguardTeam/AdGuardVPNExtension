import { init } from './initCommon';

// Init modules that must be invoked on the top level
// and adds adguard variables to the global scope
init.syncInitModules();

// Init all other modules
(async () => {
    await init.asyncInitModules();
})();
