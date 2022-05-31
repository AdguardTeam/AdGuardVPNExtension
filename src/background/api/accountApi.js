import { Api } from './Api';
import { fallbackApi } from './fallbackApi';

class AccountApi extends Api {
    GET_VPN_TOKEN = { path: 'products/licenses/vpn.json', method: 'GET' };

    async getVpnToken(accessToken) {
        const { path, method } = this.GET_VPN_TOKEN;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    }

    GET_ACCOUNT_INFO = { path: 'account/info', method: 'GET' };

    getAccountInfo(accessToken) {
        const { path, method } = this.GET_ACCOUNT_INFO;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    }

    GET_REFERRAL_DATA = { path: 'vpn_invites', method: 'GET' };

    getReferralData = async (accessToken) => {
        const { path, method } = this.GET_REFERRAL_DATA;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    };
}

export const accountApi = new AccountApi(async () => `${await fallbackApi.getAccountApiUrl()}/api/1.0`);
