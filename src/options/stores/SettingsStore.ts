import {
    action,
    observable,
    runInAction,
    computed,
} from 'mobx';
import { nanoid } from 'nanoid';

import {
    SETTINGS_IDS,
    AppearanceTheme,
    APPEARANCE_THEME_DEFAULT,
    THEME_URL_PARAMETER,
    SubscriptionType,
    QuickConnectSetting,
    QUICK_CONNECT_SETTING_DEFAULT,
    DnsOperationResult,
} from '../../lib/constants';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../background/dns/dnsConstants';
import { messenger } from '../../lib/messenger';
import { RequestStatus } from './consts';
import { log } from '../../lib/logger';
import { setQueryParameter } from '../../common/url-utils';
import type { DnsServerData } from '../../background/schema';
import type { RootStore } from './RootStore';
import { reactTranslator } from '../../common/reactTranslator';

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
    appearanceTheme: AppearanceTheme;
    isPremiumToken: boolean;
    subscriptionType: SubscriptionType;
    customDnsServers: DnsServerData[];
    quickConnectSetting: QuickConnectSetting;
}

export class SettingsStore {
    @observable isRateVisible = true;

    @observable isPremiumToken: boolean;

    @observable premiumFeatures = true;

    @observable appVersion: string;

    @observable currentUsername: string;

    @observable webRTCEnabled = false;

    @observable appearanceTheme: AppearanceTheme = APPEARANCE_THEME_DEFAULT;

    @observable contextMenusEnabled = false;

    @observable helpUsImprove = false;

    @observable dnsServer = DEFAULT_DNS_SERVER.id;

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
        available: false,
    };

    @observable multiplatformBonus = {
        available: false,
    };

    @observable bonusesDataRequestStatus: string;

    @observable subscriptionType: SubscriptionType | null = null;

    @observable showBugReporter = false;

    @observable showDnsSettings = false;

    @observable quickConnect = QUICK_CONNECT_SETTING_DEFAULT;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

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

    @action setAppearanceTheme = async (value: AppearanceTheme): Promise<void> => {
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
                this.dnsServer = DEFAULT_DNS_SERVER.id;
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
        this.quickConnect = data.quickConnectSetting;
    };

    @action updateCurrentUsername = async (): Promise<void> => {
        const currentUsername = await messenger.getUsername();
        runInAction(() => {
            this.currentUsername = currentUsername;
        });
    };

    @action updateBonusesData = async (): Promise<void> => {
        this.bonusesDataRequestStatus = RequestStatus.Pending;
        const bonusesData = await messenger.getBonusesData();

        if (!bonusesData) {
            log.warn('Available bonuses data request failed');
            this.bonusesDataRequestStatus = RequestStatus.Error;
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
            this.bonusesDataRequestStatus = RequestStatus.Done;
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
    ): Promise<DnsOperationResult> => {
        log.info(`Adding DNS server: ${dnsServerName} with address: ${dnsServerAddress}`);
        const dnsServer = {
            id: nanoid(),
            title: dnsServerName,
            address: dnsServerAddress,
        };

        const result: DnsOperationResult = await messenger.addCustomDnsServer(dnsServer);

        if (result === DnsOperationResult.Success) {
            runInAction(() => {
                this.customDnsServers.push(dnsServer);
            });
            await this.setDnsServer(dnsServer.id);

            this.rootStore.notificationsStore.notifySuccess(
                reactTranslator.getMessage('settings_dns_add_custom_server_notification_success'),
                {
                    action: reactTranslator.getMessage('settings_exclusions_undo'),
                    handler: () => this.removeCustomDnsServer(dnsServer.id),
                },
            );
        }

        return result;
    };

    @action editCustomDnsServer = async (
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<DnsOperationResult> => {
        const result = await messenger.editCustomDnsServer({
            id: this.dnsServerToEdit!.id,
            title: dnsServerName,
            address: dnsServerAddress,
        });

        if (result === DnsOperationResult.Success) {
            const editedDnsServers = await messenger.getSetting(SETTINGS_IDS.CUSTOM_DNS_SERVERS);
            this.setCustomDnsServers(editedDnsServers);
            this.setDnsServerToEdit(null);
        }

        return result;
    };

    @action removeCustomDnsServer = async (dnsServerId: string): Promise<void> => {
        this.customDnsServers = this.customDnsServers.filter((server) => server.id !== dnsServerId);
        await messenger.removeCustomDnsServer(dnsServerId);
        if (this.dnsServer === dnsServerId) {
            await this.setDnsServer(DEFAULT_DNS_SERVER.id);
        }
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
        const currentDnsServer = [
            DEFAULT_DNS_SERVER,
            ...POPULAR_DNS_SERVERS,
            ...this.customDnsServers,
        ].find((server) => server.id === this.dnsServer);
        if (currentDnsServer) {
            return currentDnsServer.title;
        }
        return null;
    }

    @action resendConfirmationLink = async (): Promise<void> => {
        await messenger.resendConfirmRegistrationLink(false);
    };

    @action setShowBugReporter = (value: boolean) => {
        this.showBugReporter = value;
    };

    @action setShowDnsSettings = (value: boolean) => {
        this.showDnsSettings = value;
    };

    /**
     * Hides components rendered on separate screens without routing:
     * DNS settings and Bug Reporter
     */
    @action closeSubComponents = () => {
        this.setShowBugReporter(false);
        this.setShowDnsSettings(false);
    };

    @action setQuickConnectSetting = async (value: QuickConnectSetting): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.QUICK_CONNECT, value);
        runInAction(() => {
            this.quickConnect = value;
        });
    };

    @computed get invitesQuestCompleted() {
        return this.invitesBonuses.invitesCount >= this.invitesBonuses.maxInvitesCount;
    }

    @computed get confirmEmailQuestCompleted() {
        return !this.confirmBonus.available;
    }

    @computed get addDeviceQuestCompleted() {
        return !this.multiplatformBonus.available;
    }
}
