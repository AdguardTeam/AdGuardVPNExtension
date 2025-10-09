import { getForwarderUrl } from '../../common/helpers';
import { accountApi, type VpnSubscriptionData } from '../api';
import { forwarder } from '../forwarder';

interface VpnTokenData {
    /**
     * Token needed for accessing VPN service.
     */
    token: string;

    /**
     * License status.
     * Possible values: 'NOT_EXISTS', 'EXPIRED', 'LIMIT_EXCEEDED', 'BLOCKED', 'VALID'.
     * TODO: Convert to enum.
     */
    licenseStatus: string;

    /**
     * Token expiration timestamp (in seconds).
     */
    timeExpiresSec: number;

    /**
     * Token expiration time in ISO 8601 format (yyyy-MM-dd'T'HH:mm:ssZ).
     */
    timeExpiresIso: string;

    /**
     * License key (`null` for FREE token).
     */
    licenseKey: string | null;

    /**
     * VPN license subscription info.
     */
    vpnSubscription: VpnSubscriptionData | null;
}

export type AccountInfoData = {
    /**
     * Current user's username.
     */
    username: string,

    /**
     * Current user's registration time in ISO format.
     */
    registrationTimeISO: string,
};

/**
 * Account settings data.
 *
 * Note: We only use `marketingConsent` field, rest of the fields are unused,
 * but to match with backend API response structure, we keep them here.
 */
export type AccountSettingsData = {
    /**
     * Is email notifications enabled for user.
     *
     * Note: This field is optional because it's optional in the backend API.
     */
    isEmailNotificationsEnabled?: boolean;

    /**
     * User decision about the marketing consent.
     *
     * Note: This field is optional because it's optional in the backend API.
     */
    marketingConsent?: boolean;

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
    is2faEnabled?: boolean;

    /**
     * User decision about the email tracking consent.
     *
     * Note: This field is optional because it's optional in the backend API.
     */
    disableTracking?: boolean;
};

export interface BonusesData {
    multiplatformBonus: {
        available: boolean,
    };
    invitesBonuses: {
        inviteUrl: string,
        invitesCount: number,
        maxInvitesCount: number,
    };
}

const getVpnToken = async (accessToken: string): Promise<VpnTokenData | null> => {
    const vpnTokenData = await accountApi.getVpnToken(accessToken);

    if (!vpnTokenData || !vpnTokenData.tokens) {
        return null;
    }

    const vpnToken = vpnTokenData.tokens.find((token) => {
        if (vpnTokenData.token) {
            return token.token === vpnTokenData.token;
        }
        return token.token;
    });

    if (!vpnToken) {
        return null;
    }

    const {
        token,
        license_status: licenseStatus,
        time_expires_sec: timeExpiresSec,
        time_expires_iso: timeExpiresIso,
        license_key: licenseKey,
        vpn_subscription: vpnSubscription,
    } = vpnToken;

    return {
        token,
        licenseStatus,
        timeExpiresSec,
        timeExpiresIso,
        licenseKey,
        vpnSubscription,
    };
};

/**
 * Uses account api to fetch account info.
 *
 * @param accessToken Access token.
 *
 * @returns Account info: username and registration time in ISO format.
 */
const getAccountInfo = async (accessToken: string): Promise<AccountInfoData> => {
    const {
        email: username,
        time_added_iso: registrationTime,
    } = await accountApi.getAccountInfo(accessToken);

    return {
        username,
        registrationTimeISO: registrationTime,
    };
};

/**
 * Uses account api to fetch account settings.
 *
 * @param accessToken Access token.
 *
 * @returns Account settings: Is email notification enabled, marketing consent,
 * language, is 2FA enabled, is "disable tracking" enabled.
 */
const getAccountSettings = async (accessToken: string): Promise<AccountSettingsData> => {
    const {
        is_email_notifications_enabled: isEmailNotificationsEnabled,
        marketing_consent: marketingConsent,
        language,
        is_2fa_enabled: is2faEnabled,
        disable_tracking: disableTracking,
    } = await accountApi.getAccountSettings(accessToken);

    return {
        isEmailNotificationsEnabled,
        marketingConsent,
        language,
        is2faEnabled,
        disableTracking,
    };
};

/**
 * Updates marketing consent for user.
 *
 * @param accessToken Access token.
 * @param marketingConsent User decision about the marketing consent.
 */
const updateMarketingConsent = async (accessToken: string, marketingConsent: boolean): Promise<void> => {
    await accountApi.updateMarketingConsent(accessToken, marketingConsent);
};

const getAvailableBonuses = async (accessToken: string): Promise<BonusesData> => {
    const bonusesData = await accountApi.getAvailableBonuses(accessToken);
    const {
        multiplatform_bonus: multiplatformBonus,
    } = bonusesData;

    const inviteId = bonusesData.invites_bonuses.invite_id;

    const forwarderDomain = await forwarder.updateAndGetDomain();
    const inviteUrl = getForwarderUrl(
        forwarderDomain,
        `action=referral_link&app=vpn_extension&invite_id=${inviteId}`,
    );

    return {
        multiplatformBonus,
        invitesBonuses: {
            inviteUrl,
            invitesCount: bonusesData.invites_bonuses.invites_count,
            maxInvitesCount: bonusesData.invites_bonuses.max_invites_count,
        },
    };
};

export const accountProvider = {
    getVpnToken,
    getAccountInfo,
    getAccountSettings,
    updateMarketingConsent,
    getAvailableBonuses,
};
