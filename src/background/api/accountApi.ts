import { Method } from 'axios';

import { Api } from './Api';
import { fallbackApi } from './fallbackApi';

interface TokensInterface {
    token: string;
    license_status: string;
    time_expires_sec: number;
    time_expires_iso: string;
    license_key: string;
    max_devices_count: number;
    vpn_subscription: {
        status: string;
        next_bill_date_sec: number;
        next_bill_date_iso: string;
        duration_v2: string;
    }
}

interface VpnTokenData {
    token?: string;
    tokens?: Array<TokensInterface>;
}

interface AccountInfo {
    email: string;
    time_added_iso: string;
}

interface ReferralData {
    invite_id: string;
    invites_count: number;
    max_invites_count: number;
    applied_at_millis: Array<number>;
}

interface AccountApiInterface {
    getVpnToken(accessToken: string): Promise<VpnTokenData>;
    getAccountInfo(accessToken: string): Promise<AccountInfo>;
    getReferralData(accessToken: string): Promise<ReferralData>;
    resendConfirmRegistrationLink(accessToken: string): Promise<void>;
}

class AccountApi extends Api implements AccountApiInterface {
    GET_VPN_TOKEN = { path: 'products/licenses/vpn.json', method: 'GET' as Method };

    getVpnToken(accessToken: string): Promise<VpnTokenData> {
        const { path, method } = this.GET_VPN_TOKEN;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    }

    GET_ACCOUNT_INFO = { path: 'account/info', method: 'GET' as Method };

    getAccountInfo(accessToken: string): Promise<AccountInfo> {
        const { path, method } = this.GET_ACCOUNT_INFO;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    }

    GET_REFERRAL_DATA = { path: 'vpn_invites', method: 'GET' as Method };

    getReferralData = async (accessToken: string): Promise<ReferralData> => {
        const { path, method } = this.GET_REFERRAL_DATA;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    };

    RESEND_CONFIRM_REGISTRATION_LINK = { path: 'account/resend_confirm_registration_email', method: 'POST' as Method };

    resendConfirmRegistrationLink = async (accessToken: string) => {
        const { path, method } = this.RESEND_CONFIRM_REGISTRATION_LINK;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    };
}

export const accountApi = new AccountApi(async () => `${await fallbackApi.getAccountApiUrl()}/api/1.0`);
