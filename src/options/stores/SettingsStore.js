import {
    action,
    observable,
    runInAction,
} from 'mobx';
import { nanoid } from 'nanoid';

import { SETTINGS_IDS, APPEARANCE_THEME_DEFAULT } from '../../lib/constants';
import { DNS_DEFAULT } from '../../background/dns/dnsConstants';
import { messenger } from '../../lib/messenger';
import { REQUEST_STATUSES } from './consts';
import { log } from '../../lib/logger';

export class SettingsStore {
    @observable isRateVisible = true;

    @observable isPremiumToken;

    @observable premiumFeatures = true;

    @observable appVersion;

    @observable currentUsername;

    @observable webRTCEnabled = false;

    @observable appearanceTheme = APPEARANCE_THEME_DEFAULT;

    @observable contextMenusEnabled = false;

    @observable helpUsImprove = false;

    @observable dnsServer = DNS_DEFAULT;

    @observable dnsServerToEdit = null;

    @observable customDnsServers = [];

    @observable nextBillDate;

    @observable inviteUrl = '';

    @observable invitesCount = 0;

    @observable referralDataRequestStatus;

    @observable subscriptionType = null;

    @action
    async requestIsPremiumToken() {
        const isPremiumToken = await messenger.checkIsPremiumToken();
        runInAction(() => {
            this.isPremiumToken = isPremiumToken;
        });
    }

    @action hideRate = async () => {
        await messenger.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action hidePremiumFeatures = async () => {
        await messenger.setSetting(SETTINGS_IDS.PREMIUM_FEATURES_SHOW, false);
        runInAction(() => {
            this.premiumFeatures = false;
        });
    };

    @action disableProxy = async () => {
        await messenger.disableProxy(true);
    };

    @action setWebRTCValue = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED, value);
        runInAction(() => {
            this.webRTCEnabled = value;
        });
    };

    @action setAppearanceTheme = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.APPEARANCE_THEME, value);
        runInAction(() => {
            this.appearanceTheme = value;
        });
    };

    @action setContextMenusValue = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED, value);
        runInAction(() => {
            this.contextMenusEnabled = value;
        });
    };

    @action setHelpUsImproveValue = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.HELP_US_IMPROVE, value);
        runInAction(() => {
            this.helpUsImprove = value;
        });
    };

    @action setDnsServer = async (value) => {
        if (!value) {
            return;
        }
        await messenger.setSetting(SETTINGS_IDS.SELECTED_DNS_SERVER, value);
        runInAction(() => {
            this.dnsServer = value;
        });
    };

    @action setOptionsData = (data) => {
        this.appVersion = data.appVersion;
        this.currentUsername = data.username;
        this.nextBillDate = data.nextBillDate;
        this.isRateVisible = data.isRateVisible;
        this.premiumFeatures = data.isPremiumFeaturesShow;
        this.webRTCEnabled = data.webRTCEnabled;
        this.contextMenusEnabled = data.contextMenusEnabled;
        this.helpUsImprove = data.helpUsImprove;
        this.dnsServer = data.dnsServer;
        this.appearanceTheme = data.appearanceTheme;
        this.subscriptionType = data.subscriptionType;
    };

    @action updateCurrentUsername = async () => {
        const currentUsername = await messenger.getUsername();
        runInAction(() => {
            this.currentUsername = currentUsername;
        });
    };

    @action updateReferralData = async () => {
        this.referralDataRequestStatus = REQUEST_STATUSES.PENDING;
        const referralData = await messenger.getReferralData();
        const { inviteUrl, invitesCount, maxInvitesCount } = referralData;
        if (Number.isNaN(invitesCount)) {
            log.warn('Referral data request failed');
            this.referralDataRequestStatus = REQUEST_STATUSES.ERROR;
            return;
        }
        runInAction(() => {
            this.inviteUrl = inviteUrl;
            this.invitesCount = invitesCount;
            this.maxInvitesCount = maxInvitesCount;
            this.referralDataRequestStatus = REQUEST_STATUSES.DONE;
        });
    };

    @action openPremiumPromoPage = async () => {
        await messenger.openPremiumPromoPage();
    };

    @action setCustomDnsServers = (dnsServersData) => {
        this.customDnsServers = dnsServersData;
    };

    @action addCustomDnsServer = async (dnsServerName, dnsServerAddress) => {
        log.info(`Adding DNS server: ${dnsServerName} with address: ${dnsServerAddress}`);
        const dnsServer = {
            id: nanoid(),
            title: dnsServerName,
            ip: dnsServerAddress,
        };
        this.customDnsServers.push(dnsServer);
        await messenger.addCustomDnsServer(dnsServer);
    };

    @action editCustomDnsServer = (dnsServerName, dnsServerAddress) => {
        if (this.dnsServerToEdit) {
            return;
        }
        this.customDnsServers = this.customDnsServers.map((server) => {
            if (server.id === this.dnsServerToEdit.id) {
                return {
                    id: this.dnsServerToEdit.id,
                    title: dnsServerName,
                    ip: dnsServerAddress,
                };
            }
            return server;
        });

        this.dnsServerToEdit = null;
    };

    @action removeCustomDnsServer = async (dnsServerId) => {
        this.customDnsServers = this.customDnsServers.filter((server) => server.id !== dnsServerId);
        await messenger.removeCustomDnsServer(dnsServerId);
    };

    @action setDnsServerToEdit = (value) => {
        this.dnsServerToEdit = value;
    };
}
