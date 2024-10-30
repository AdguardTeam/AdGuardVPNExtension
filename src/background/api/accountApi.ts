import { type SubscriptionType } from '../../common/constants';

import { Api } from './Api';
import { fallbackApi } from './fallbackApi';
import { type RequestProps } from './apiTypes';

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
        duration_v2: SubscriptionType;
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

interface BonusesData {
    confirm_bonus: {
        available: boolean,
        applied_at_millis: number | null,
    };
    invites_bonuses: {
        invite_id: string,
        invites_count: number,
        max_invites_count: number,
        applied_at_millis: Array<number> | null,
    };
    multiplatform_bonus: {
        available: boolean,
        applied_at_millis: number | null,
    };
}

interface AccountApiInterface {
    getVpnToken(accessToken: string): Promise<VpnTokenData>;

    /**
     * Fetches account info by access token via request to `account/info`.
     *
     * @param accessToken Access token.
     *
     * @returns Account info: email and time added (registration time) in ISO format.
     */
    getAccountInfo(accessToken: string): Promise<AccountInfo>;

    /**
     * Sends request to resend confirm registration link via `account/resend_confirm_registration_email`.
     *
     * @param accessToken Access token.
     */
    resendConfirmRegistrationLink(accessToken: string): Promise<void>;
}

class AccountApi extends Api implements AccountApiInterface {
    GET_VPN_TOKEN: RequestProps = { path: 'products/licenses/vpn.json', method: 'GET' };

    getVpnToken(accessToken: string): Promise<VpnTokenData> {
        const { path, method } = this.GET_VPN_TOKEN;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    }

    GET_ACCOUNT_INFO: RequestProps = { path: 'account/info', method: 'GET' };

    getAccountInfo(accessToken: string): Promise<AccountInfo> {
        const { path, method } = this.GET_ACCOUNT_INFO;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    }

    RESEND_CONFIRM_REGISTRATION_LINK: RequestProps = { path: 'account/resend_confirm_registration_email', method: 'POST' };

    resendConfirmRegistrationLink = async (accessToken: string): Promise<void> => {
        const { path, method } = this.RESEND_CONFIRM_REGISTRATION_LINK;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    };

    GET_AVAILABLE_BONUSES: RequestProps = { path: 'vpn/bonuses', method: 'GET' };

    getAvailableBonuses = async (accessToken: string): Promise<BonusesData> => {
        const { path, method } = this.GET_AVAILABLE_BONUSES;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest(path, config, method);
    };
}

export const accountApi = new AccountApi(async () => `${await fallbackApi.getAccountApiUrl()}/api/1.0`);
