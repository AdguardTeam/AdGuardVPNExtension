import { type SubscriptionType } from '../../common/constants';

import { Api } from './Api';
import { fallbackApi } from './fallbackApi';
import { type RequestProps } from './apiTypes';

/**
 * VPN subscription data.
 */
export interface VpnSubscriptionData {
    /**
     * Subscription status.
     * Possible values: 'ACTIVE', 'PAST_DUE', 'PAUSED', 'DELETED'.
     * TODO: Convert to enum.
     */
    status: string;

    /**
     * Subscription expiration timestamp (in seconds).
     */
    next_bill_date_sec: number;

    /**
     * Subscription expiration time in ISO 8601 format (yyyy-MM-dd'T'HH:mm:ssZ).
     */
    next_bill_date_iso: string;

    /**
     * Subscription duration.
     */
    duration_v2: SubscriptionType;
}

/**
 * VPN license token info.
 */
interface TokensInterface {
    /**
     * Token needed for accessing VPN service.
     */
    token: string;

    /**
     * License status.
     * Possible values: 'NOT_EXISTS', 'EXPIRED', 'LIMIT_EXCEEDED', 'BLOCKED', 'VALID'.
     * TODO: Convert to enum.
     */
    license_status: string;

    /**
     * Token expiration timestamp (in seconds).
     */
    time_expires_sec: number;

    /**
     * Token expiration time in ISO 8601 format (yyyy-MM-dd'T'HH:mm:ssZ).
     */
    time_expires_iso: string;

    /**
     * License key (`null` for FREE token).
     */
    license_key: string | null;

    /**
     * Max number of connected devices.
     */
    max_devices_count: number;

    /**
     * VPN license subscription info.
     */
    vpn_subscription: VpnSubscriptionData | null;
}

/**
 * VPN tokens data.
 */
interface VpnTokenData {
    /**
     * Token needed for accessing VPN backend.
     */
    token?: string;

    /**
     * List of VPN license tokens.
     */
    tokens?: Array<TokensInterface>;
}

interface AccountInfo {
    email: string;
    time_added_iso: string;
}

/**
 * Account settings data received from backend.
 *
 * Note: We only use `marketing_consent` field, rest of the fields are unused,
 * but to match with backend API response structure, we keep them here.
 */
interface AccountSettings {
    /**
     * Is email notifications enabled for user.
     *
     * Note: This field is optional because it's optional in the backend API.
     */
    is_email_notifications_enabled?: boolean;

    /**
     * User decision about the marketing consent.
     *
     * Note: This field is optional because it's optional in the backend API.
     */
    marketing_consent?: boolean;

    /**
     * User language.
     *
     * Note: This field is optional because it's optional in the backend API.
     */
    language?: string;

    /**
     * Is 2FA verification enabled for user.
     *
     * Note: This field is optional because it's optional in the backend API.
     */
    is_2fa_enabled?: boolean;

    /**
     * User decision about the email tracking consent.
     *
     * Note: This field is optional because it's optional in the backend API.
     */
    disable_tracking?: boolean;
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
     * Fetches account settings by access token via request to `account/settings`.
     *
     * @param accessToken Access token.
     *
     * @returns Account settings: Is email notification enabled, marketing consent,
     * language, is 2FA enabled, is "disable tracking" enabled.
     */
    getAccountSettings(accessToken: string): Promise<AccountSettings>;

    /**
     * Updates marketing consent for user.
     *
     * @param accessToken Access token.
     * @param marketingConsent User decision about the marketing consent.
     */
    updateMarketingConsent(accessToken: string, marketingConsent: boolean): Promise<void>;
}

class AccountApi extends Api implements AccountApiInterface {
    GET_VPN_TOKEN: RequestProps = { path: 'products/licenses/vpn.json', method: 'GET' };

    getVpnToken(accessToken: string): Promise<VpnTokenData> {
        const { path, method } = this.GET_VPN_TOKEN;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest<VpnTokenData>(path, config, method);
    }

    GET_ACCOUNT_INFO: RequestProps = { path: 'account/info', method: 'GET' };

    getAccountInfo(accessToken: string): Promise<AccountInfo> {
        const { path, method } = this.GET_ACCOUNT_INFO;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest<AccountInfo>(path, config, method);
    }

    GET_ACCOUNT_SETTINGS: RequestProps = { path: 'account/settings', method: 'GET' };

    getAccountSettings = async (accessToken: string): Promise<AccountSettings> => {
        const { path, method } = this.GET_ACCOUNT_SETTINGS;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest<AccountSettings>(path, config, method);
    };

    UPDATE_MARKETING_CONSENT: RequestProps = { path: 'account/update_marketing_consent', method: 'POST' };

    updateMarketingConsent = async (accessToken: string, marketingConsent: boolean): Promise<void> => {
        const { path, method } = this.UPDATE_MARKETING_CONSENT;
        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ marketing_consent: marketingConsent }),
        };
        return this.makeRequest(path, config, method);
    };

    GET_AVAILABLE_BONUSES: RequestProps = { path: 'vpn/bonuses', method: 'GET' };

    getAvailableBonuses = async (accessToken: string): Promise<BonusesData> => {
        const { path, method } = this.GET_AVAILABLE_BONUSES;
        const config = {
            headers: { Authorization: `Bearer ${accessToken}` },
        };
        return this.makeRequest<BonusesData>(path, config, method);
    };
}

export const accountApi = new AccountApi(async () => `${await fallbackApi.getAccountApiUrl()}/api/1.0`);
