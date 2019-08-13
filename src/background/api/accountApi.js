import Api from './Api';

class AccountApi extends Api {
    GET_VPN_TOKEN = { path: 'products/licenses/vpn.json', method: 'GET' };

    getVpnToken(accessToken) {
        const { path, method } = this.GET_VPN_TOKEN;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, method, config);
    }
}

// check that this url is presented in the manifest file
const ACCOUNT_BASE_URL = 'http://10.7.143.216:8181/api/1.0';

const accountApi = new AccountApi(ACCOUNT_BASE_URL);

export default accountApi;
