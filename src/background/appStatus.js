import { proxy } from './proxy';
import settings from './settings';
import { MESSAGES_TYPES } from '../lib/constants';
import browserApi from './browserApi';

class AppStatus {
    constructor() {
        this.error = null;
    }

    setError(error) {
        this.error = error;
        browserApi.sendMessage({
            type: MESSAGES_TYPES.TOKENS_UPDATE_ERROR,
            data: error.message,
        });
    }

    getError() {
        return this.error || null;
    }

    async canControlProxy() {
        const controlStatus = await proxy.canControlProxy();
        if (controlStatus.canControlProxy) {
            return controlStatus;
        }

        // Turns off proxy if proxy was enabled
        const proxyEnabled = await settings.isProxyEnabled();
        if (proxyEnabled) {
            await settings.disableProxy();
        }

        return controlStatus;
    }
}

const appStatus = new AppStatus();

export default appStatus;
