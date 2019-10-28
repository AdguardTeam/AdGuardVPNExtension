import vpn from './vpn';
import appStatus from './appStatus';

// TODO [maximtop] move other data for popup here
const getPopupData = async () => {
    const permissionsError = appStatus.getPermissionsError();
    const vpnInfo = await vpn.getVpnInfo();
    const endpoints = await vpn.getEndpoints();
    const selectedEndpoint = await vpn.getSelectedEndpoint();
    return {
        permissionsError,
        vpnInfo,
        endpoints,
        selectedEndpoint,
    };
};

export default { getPopupData };
