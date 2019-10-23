import vpn from './vpn';

// TODO [maximtop] move other data for popup here
const getPopupData = async () => {
    const vpnInfo = await vpn.getVpnInfo();
    const endpoints = await vpn.getEndpoints();
    const selectedEndpoint = await vpn.getSelectedEndpoint();
    return {
        vpnInfo,
        endpoints,
        selectedEndpoint,
    };
};

export default { getPopupData };
