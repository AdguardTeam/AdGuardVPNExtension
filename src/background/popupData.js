import vpn from './vpn';
import appStatus from './appStatus';

// TODO [maximtop] move other data for popup here
const getPopupData = async () => {
    const permissionsError = appStatus.getPermissionsError();
    const vpnInfo = vpn.getVpnInfo();
    const endpoints = vpn.getEndpoints();
    const selectedEndpoint = await vpn.getSelectedEndpoint();
    return {
        permissionsError,
        vpnInfo,
        endpoints,
        selectedEndpoint,
    };
};

const sleep = waitTime => new Promise((resolve) => {
    setTimeout(resolve, waitTime);
});

const getPopupDataRetry = async (retryNum = 1, retryDelay = 100) => {
    const data = await getPopupData();
    const { vpnInfo, endpoints, selectedEndpoint } = data;
    if (!vpnInfo || !endpoints || !selectedEndpoint) {
        if (retryNum <= 1) {
            throw new Error(`Unable to get data in ${retryNum} retries`);
        }
        await sleep(retryDelay);
        return getPopupDataRetry(retryNum - 1);
    }
    return data;
};

export default { getPopupData, getPopupDataRetry };
