import {
    action,
    observable,
    runInAction,
    computed,
} from 'mobx';
import { nanoid } from 'nanoid';

import { SETTINGS_IDS, APPEARANCE_THEME_DEFAULT, THEME_URL_PARAMETER } from '../../lib/constants';
import { DNS_DEFAULT, DNS_SERVERS } from '../../background/dns/dnsConstants';
import { messenger } from '../../lib/messenger';
import { REQUEST_STATUSES } from './consts';
import { log } from '../../lib/logger';
import { setQueryParameter } from '../../common/url-utils';

interface DnsServerData {
    id: string;
    address: string;
    title: string;
}

interface OptionsData {
    appVersion: string;
    username: string;
    nextBillDate: number;
    isRateVisible: boolean;
    isPremiumFeaturesShow: boolean;
    webRTCEnabled: boolean;
    contextMenusEnabled: boolean;
    helpUsImprove: boolean;
    dnsServer: string;
    appearanceTheme: string;
    isPremiumToken: boolean;
    subscriptionType: string;
    customDnsServers: DnsServerData[];
}

export class SettingsStore {
    @observable isRateVisible = true;

    @observable isPremiumToken: boolean;

    @observable premiumFeatures = true;

    @observable appVersion: string;

    @observable currentUsername: string;

    @observable webRTCEnabled = false;

    @observable appearanceTheme = APPEARANCE_THEME_DEFAULT;

    @observable contextMenusEnabled = false;

    @observable helpUsImprove = false;

    @observable dnsServer = DNS_DEFAULT;

    @observable dnsServerToEdit: DnsServerData | null = null;

    @observable isCustomDnsModalOpen = false;

    @observable customDnsServers: DnsServerData[];

    @observable nextBillDate: number;

    @observable invitesBonuses = {
        inviteUrl: '',
        invitesCount: 0,
        maxInvitesCount: 0,
    };

    @observable confirmBonus = {
        available: true,
    };

    @observable multiplatformBonus = {
        available: true,
    };

    @observable bonusesDataRequestStatus: string;

    @observable subscriptionType: string | null = null;

    @action
    async requestIsPremiumToken(): Promise<void> {
        const isPremiumToken = await messenger.checkIsPremiumToken();
        runInAction(() => {
            this.isPremiumToken = isPremiumToken;
        });
    }

    @action hideRate = async (): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action hidePremiumFeatures = async (): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.PREMIUM_FEATURES_SHOW, false);
        runInAction(() => {
            this.premiumFeatures = false;
        });
    };

    @action disableProxy = async (): Promise<void> => {
        await messenger.disableProxy(true);
    };

    @action setWebRTCValue = async (value: boolean): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED, value);
        runInAction(() => {
            this.webRTCEnabled = value;
        });
    };

    @action setAppearanceTheme = async (value: string): Promise<void> => {
        setQueryParameter(THEME_URL_PARAMETER, value);
        await messenger.setSetting(SETTINGS_IDS.APPEARANCE_THEME, value);
        runInAction(() => {
            this.appearanceTheme = value;
        });
    };

    @action setContextMenusValue = async (value: boolean): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED, value);
        runInAction(() => {
            this.contextMenusEnabled = value;
        });
    };

    @action setHelpUsImproveValue = async (value: boolean): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.HELP_US_IMPROVE, value);
        runInAction(() => {
            this.helpUsImprove = value;
        });
    };

    @action setDnsServer = async (value: string): Promise<void> => {
        if (!value) {
            runInAction(() => {
                this.dnsServer = DNS_DEFAULT;
            });
            return;
        }
        await messenger.setSetting(SETTINGS_IDS.SELECTED_DNS_SERVER, value);
        runInAction(() => {
            this.dnsServer = value;
        });
    };

    @action setOptionsData = (data: OptionsData): void => {
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
        this.customDnsServers = data.customDnsServers;
    };

    @action updateCurrentUsername = async (): Promise<void> => {
        const currentUsername = await messenger.getUsername();
        runInAction(() => {
            this.currentUsername = currentUsername;
        });
    };

    @action updateBonusesData = async (): Promise<void> => {
        this.bonusesDataRequestStatus = REQUEST_STATUSES.PENDING;
        const bonusesData = await messenger.getBonusesData();

        if (!bonusesData) {
            log.warn('Available bonuses data request failed');
            this.bonusesDataRequestStatus = REQUEST_STATUSES.ERROR;
            return;
        }

        const { invitesBonuses, confirmBonus, multiplatformBonus } = bonusesData;

        runInAction(() => {
            this.invitesBonuses = {
                inviteUrl: invitesBonuses.inviteUrl,
                invitesCount: invitesBonuses.invitesCount,
                maxInvitesCount: invitesBonuses.maxInvitesCount,
            };
            this.confirmBonus.available = confirmBonus.available;
            this.multiplatformBonus.available = multiplatformBonus.available;
            this.bonusesDataRequestStatus = REQUEST_STATUSES.DONE;
        });
    };

    @action openPremiumPromoPage = async (): Promise<void> => {
        await messenger.openPremiumPromoPage();
    };

    @action setCustomDnsServers = (dnsServersData: DnsServerData[]): void => {
        this.customDnsServers = dnsServersData;
    };

    @action addCustomDnsServer = async (
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<DnsServerData> => {
        log.info(`Adding DNS server: ${dnsServerName} with address: ${dnsServerAddress}`);
        const dnsServer = {
            id: nanoid(),
            title: dnsServerName,
            address: dnsServerAddress,
        };
        this.customDnsServers.push(dnsServer);
        await messenger.addCustomDnsServer(dnsServer);
        await this.setDnsServer(dnsServer.id);
        return dnsServer;
    };

    @action editCustomDnsServer = async (
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<void> => {
        if (!this.dnsServerToEdit) {
            return;
        }

        const editedDnsServers = await messenger.editCustomDnsServer({
            id: this.dnsServerToEdit.id,
            title: dnsServerName,
            address: dnsServerAddress,
        });

        this.setCustomDnsServers(editedDnsServers);
        this.setDnsServerToEdit(null);
    };

    @action removeCustomDnsServer = async (dnsServerId: string): Promise<void> => {
        this.customDnsServers = this.customDnsServers.filter((server) => server.id !== dnsServerId);
        await messenger.removeCustomDnsServer(dnsServerId);
    };

    @action restoreCustomDnsServersData = async () => {
        const customDnsServersData = await messenger.restoreCustomDnsServersData();
        runInAction(() => {
            this.customDnsServers = customDnsServersData;
        });
    };

    @action setDnsServerToEdit = (value: DnsServerData | null): void => {
        this.dnsServerToEdit = value;
    };

    @action openCustomDnsModalOpen = (): void => {
        this.isCustomDnsModalOpen = true;
    };

    @action closeCustomDnsModalOpen = (): void => {
        this.isCustomDnsModalOpen = false;
    };

    @computed get currentDnsServerName(): string | null {
        if (!this.dnsServer) {
            return null;
        }
        const customDnsServer = this.customDnsServers
            .find((server) => server.id === this.dnsServer);
        if (customDnsServer) {
            return customDnsServer.title;
        }

        return DNS_SERVERS[this.dnsServer]?.title;
    }

    @action resendConfirmationLink = async (): Promise<void> => {
        await messenger.resendConfirmRegistrationLink(false);
    };
}
