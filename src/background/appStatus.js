import { proxy } from './proxy';
import settings from './settings';

class AppStatus {
    constructor() {
        this.globalError = null;
    }

    setGlobalError(error) {
        this.globalError = error;
    }

    error() {
        return this.globalError || null;
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

export default new AppStatus();
