import { proxy } from './proxy';
import settings from './settings';
import { MESSAGES_TYPES } from '../lib/constants';
import browserApi from './browserApi';

class AppStatus {
    constructor() {
        this.permissionsError = null;
    }

    setPermissionsError(error) {
        if (error === null) {
            this.permissionsError = null;
            return;
        }
        this.permissionsError = error;
        browserApi.sendMessage({
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
}

const appStatus = new AppStatus();

export default appStatus;
