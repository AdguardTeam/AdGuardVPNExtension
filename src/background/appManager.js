import { proxy } from './proxy';
import settings from './settings';

const getAppStatus = async () => {
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
};

export default {
    getAppStatus,
};
