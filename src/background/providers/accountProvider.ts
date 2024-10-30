import { getForwarderUrl } from '../../common/helpers';
import { accountApi } from '../api';
import { forwarder } from '../forwarder';
import { notifications } from '../notifications';
import { translator } from '../../common/translator';
import { type SubscriptionType } from '../../common/constants';

interface VpnTokenData {
    token: string;
    licenseStatus: string;
    timeExpiresSec: number;
    licenseKey: string;
    vpnSubscription: {
        status: string;
        next_bill_date_sec: number;
        next_bill_date_iso: string;
        duration_v2: SubscriptionType;
    };
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

interface BonusesData {
    confirmBonus: {
        available: boolean,
    };
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
        license_key: licenseKey,
        vpn_subscription: vpnSubscription,
    } = vpnToken;

    return {
        token,
        licenseStatus,
        timeExpiresSec,
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

const resendConfirmRegistrationLink = async (
    accessToken: string,
    displayNotification: boolean,
): Promise<void> => {
    await accountApi.resendConfirmRegistrationLink(accessToken);
    if (displayNotification) {
        await notifications.create({ message: translator.getMessage('resend_confirm_registration_link_notification') });
    }
};

const getAvailableBonuses = async (accessToken: string): Promise<BonusesData> => {
    const bonusesData = await accountApi.getAvailableBonuses(accessToken);
    const {
        confirm_bonus: confirmBonus,
        multiplatform_bonus: multiplatformBonus,
    } = bonusesData;

    const inviteId = bonusesData.invites_bonuses.invite_id;

    const forwarderDomain = await forwarder.updateAndGetDomain();
    const inviteUrl = getForwarderUrl(
        forwarderDomain,
        `action=referral_link&app=vpn_extension&invite_id=${inviteId}`,
    );

    return {
        confirmBonus,
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
    getAvailableBonuses,
    resendConfirmRegistrationLink,
};
