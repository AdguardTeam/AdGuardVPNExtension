import { BrowserApi, browserApi } from '../browserApi';
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

    vpnTokenData: VpnTokenData | null;

    private VPN_TOKEN_KEY = 'credentials.token';

    constructor(providedBrowserApi?: BrowserApi) {
        this.browserApi = providedBrowserApi || browserApi;
    }

    getVpnTokenFromStorage = async (): Promise<VpnTokenData> => {
        return this.vpnTokenData
            || this.browserApi.storage.get(this.VPN_TOKEN_KEY);
    };

    setVpnTokenToStorage = async (tokenData: VpnTokenData | null): Promise<void> => {
        this.vpnTokenData = tokenData;
        await this.browserApi.storage.set(this.VPN_TOKEN_KEY, tokenData);
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
