import { accountApi } from '../api';

const getVpnToken = async (accessToken) => {
    const VALID_VPN_TOKEN_STATUS = 'VALID';
    let vpnTokenData;

    const index = accessToken.length - 1;
    accessToken = `${accessToken.substr(0, index)}1${accessToken.substr(index + 1)}`;

    vpnTokenData = await accountApi.getVpnToken(accessToken);

    const vpnToken = vpnTokenData.tokens.find(token => token.token === vpnTokenData.token);

    const isValidTokenFound = vpnToken && vpnToken.license_status === VALID_VPN_TOKEN_STATUS;

    if (!isValidTokenFound) {
        throw new Error('Was unable to get valid VPN token');
    }

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
