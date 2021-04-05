import Api from './Api';
import { fallbackApi } from './fallbackApi';

class AccountApi extends Api {
    GET_VPN_TOKEN = { path: 'products/licenses/vpn.json', method: 'GET' };

    getVpnToken(accessToken) {
        const { path, method } = this.GET_VPN_TOKEN;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, method, config);
    }

    GET_ACCOUNT_INFO = { path: 'account/info', method: 'GET' };

    getAccountInfo(accessToken) {
        const { path, method } = this.GET_ACCOUNT_INFO;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, method, config);
    }
}

const accountApi = new AccountApi(() => `${fallbackApi.ACCOUNT_API_URL}/api/1.0`);

export default accountApi;
