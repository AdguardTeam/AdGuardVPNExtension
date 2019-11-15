import { proxy } from './proxy';
import settings from './settings/settings';
import { MESSAGES_TYPES } from '../lib/constants';
import browserApi from './browserApi';
import pJson from '../../package.json';

class AppStatus {
    constructor() {
        this.permissionsError = null;
        this.appVersion = pJson.version;
    }

    setPermissionsError(error) {
        if (error === null) {
            this.permissionsError = null;
            return;
        }
        this.permissionsError = error;
        browserApi.runtime.sendMessage({
            type: MESSAGES_TYPES.PERMISSIONS_UPDATE_ERROR,
            data: error.message,
        });
    }

    getPermissionsError() {
        return this.permissionsError;
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

    get version() {
        return this.appVersion;
    }
}

const appStatus = new AppStatus();

export default appStatus;
