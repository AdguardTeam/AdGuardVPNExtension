import browser from 'webextension-polyfill';

import { accountApi } from '../api';

// FIXME use url from tds
const REFERRAL_URL = 'https://adguard-vpn.com/join/';
const REFERRAL_URL_DEV = 'https://dev.adguard-vpn.com/join/';
const REFERRAL_URL_SUFFIX = '/form.html';

const DEV_NAME_SUFFIX = 'Dev';

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
    const manifest = browser.runtime.getManifest();
    const isDev = manifest.name.endsWith(DEV_NAME_SUFFIX);
    const inviteUrl = `${isDev ? REFERRAL_URL_DEV : REFERRAL_URL}${inviteId}${REFERRAL_URL_SUFFIX}`;
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
