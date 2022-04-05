import { accountApi } from '../api';

import { BUILD_ENV, WEBSITE_DOMAIN } from '../config';

// TODO use url from tds
const HTTPS_PROTOCOL = 'https://';
const DEV_SUBDOMAIN = 'dev.';
const REFERRAL_URL_KEYWORD = '/join/';
const REFERRAL_URL_SUFFIX = '/form.html';

const DEV_ENV = 'dev';

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
    // TODO use url from tds for inviteUrl
    const {
        invite_id: inviteId,
        invites_count: invitesCount,
        max_invites_count: maxInvitesCount,
    } = referralData;
    const isDev = BUILD_ENV === DEV_ENV;
    const inviteUrl = `${HTTPS_PROTOCOL}${isDev ? DEV_SUBDOMAIN : ''}${WEBSITE_DOMAIN}${REFERRAL_URL_KEYWORD}${inviteId}${REFERRAL_URL_SUFFIX}`;
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

export default {
    getVpnToken,
    getAccountInfo,
    getReferralData,
};
