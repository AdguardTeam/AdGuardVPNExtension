import { proxy } from './proxy';
import settings from './settings/settings';
import pJson from '../../package.json';

class AppStatus {
    constructor() {
        this.appVersion = pJson.version;
    }

    async canControlProxy() {
        const controlStatus = await proxy.canControlProxy();
        if (controlStatus.canControlProxy) {
            return controlStatus;
        }

        // Turns off proxy if proxy was enabled
        const proxyEnabled = await settings.isSettingEnabled(settings.SETTINGS_IDS.PROXY_ENABLED);
        if (proxyEnabled) {
            await settings.disableProxy();
        }

        return controlStatus;
    }

    get version() {
        return this.appVersion;
    }
}

const appStatus = new AppStatus();

export default appStatus;
