import { accountApi } from '../api';

const getVpnToken = async (accessToken) => {
    const vpnTokenData = await accountApi.getVpnToken(accessToken);
    const vpnToken = vpnTokenData.tokens.find(token => token.token === vpnTokenData.token);

    const {
        token,
        license_status: licenseStatus,
        time_expires_sec: timeExpiresSec,
        license_key: licenseKey,
        subscription,
    } = vpnToken;

    return {
        token,
        licenseStatus,
        timeExpiresSec,
        licenseKey,
        subscription,
    };
};

export default {
    getVpnToken,
};
