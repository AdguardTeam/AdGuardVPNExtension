import { init } from './initCommon';

init.syncInitModules();

(async () => {
    await init.asyncInitModules();
})();
