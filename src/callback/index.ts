import { callbackPageAuthHandler } from '../common/utils/auth';

((): void => {
    callbackPageAuthHandler(window.location.href);
    window.close();
})();
