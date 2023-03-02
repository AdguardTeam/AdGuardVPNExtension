import { BrowserApi, browserApi } from '../browserApi';
import { VPN_TOKEN_KEY } from '../../lib/constants';
import type { VpnTokenData } from './Credentials';

interface CredentialsServiceInterface {
    getVpnTokenFromStorage(): Promise<VpnTokenData>;
    setVpnTokenToStorage(tokenData: VpnTokenData | null): Promise<void>;
    isPremiumUser(): Promise<boolean>;
}

/**
 * This service stores and manages VPN token data in browser storage
 * and verifies whether a user has premium status
 */
export class CredentialsService implements CredentialsServiceInterface {
    browserApi: BrowserApi;

    constructor(providedBrowserApi?: BrowserApi) {
        this.browserApi = providedBrowserApi || browserApi;
    }

    getVpnTokenFromStorage = async (): Promise<VpnTokenData> => {
        return this.browserApi.storage.get(VPN_TOKEN_KEY);
    };

    setVpnTokenToStorage = async (tokenData: VpnTokenData | null): Promise<void> => {
        await this.browserApi.storage.set(VPN_TOKEN_KEY, tokenData);
    };

    /**
     * User is considered premium
     * if an licenseKey is present in the vpn token data
     */
    isPremiumUser = async (): Promise<boolean> => {
        const vpnToken = await this.getVpnTokenFromStorage();
        return !!vpnToken?.licenseKey;
    };
}

export const credentialsService = new CredentialsService();
