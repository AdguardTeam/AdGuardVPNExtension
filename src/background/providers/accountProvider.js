import { accountApi } from '../api';

import { FORWARDER_DOMAIN } from '../config';
import { notifications } from '../notifications';
import { translator } from '../../common/translator';

const getVpnToken = async (accessToken) => {
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
        subscription,
        vpn_subscription: vpnSubscription,
    } = vpnToken;

    return {
        token,
        licenseStatus,
        timeExpiresSec,
        licenseKey,
        subscription,
        vpnSubscription,
    };
};

const getReferralData = async (accessToken) => {
    const referralData = await accountApi.getReferralData(accessToken);
    const {
        invite_id: inviteId,
        invites_count: invitesCount,
        max_invites_count: maxInvitesCount,
    } = referralData;
    const inviteUrl = `https://${FORWARDER_DOMAIN}/forward.html?action=referral_link&app=vpn_extension&invite_id=${inviteId}`;
    return {
        inviteUrl,
        invitesCount,
        maxInvitesCount,
    };
};

const getAccountInfo = async (accessToken) => {
    const { email } = await accountApi.getAccountInfo(accessToken);
    return email;
};

const resendConfirmRegistrationLink = async (accessToken) => {
    await accountApi.resendConfirmRegistrationLink(accessToken);
    await notifications.create({ message: translator.getMessage('resend_confirm_registration_link_notification') });
};

export default {
    getVpnToken,
    getAccountInfo,
    getReferralData,
    resendConfirmRegistrationLink,
};
