import { browserApi } from '../browserApi';
import { VPN_TOKEN_KEY } from '../../lib/constants';
import type { VpnTokenData } from './Credentials';

const getVpnTokenFromStorage = async (): Promise<VpnTokenData> => {
    return browserApi.storage.get(VPN_TOKEN_KEY);
};

const setVpnTokenToStorage = async (tokenData: VpnTokenData | null): Promise<void> => {
    await browserApi.storage.set(VPN_TOKEN_KEY, tokenData);
};

const isPremiumUser = async () => {
    const vpnToken = await getVpnTokenFromStorage();
    return !!vpnToken?.licenseKey;
};

export const credentialsService = {
    getVpnTokenFromStorage,
    setVpnTokenToStorage,
    isPremiumUser,
};
