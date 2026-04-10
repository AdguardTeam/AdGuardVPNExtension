import {
    action,
    observable,
    runInAction,
    computed,
} from 'mobx';
import { nanoid } from 'nanoid';

import {
    SETTINGS_IDS,
    type AppearanceTheme,
    APPEARANCE_THEME_DEFAULT,
    type SubscriptionType,
    type QuickConnectSetting,
    QUICK_CONNECT_SETTING_DEFAULT,
} from '../../common/constants';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../common/dnsConstants';
import { type LocalePreference, LANGUAGE_AUTO } from '../../common/locale';
import { messenger } from '../../common/messenger';
import { log } from '../../common/logger';
import type { DnsServerData } from '../../background/schema';
import { type CustomDnsData } from '../hooks/useQueryStringData';
import type { ExclusionsData, ServiceDto } from '../../common/exclusionsConstants';

import type { RootStore } from './RootStore';
import { RequestStatus } from './consts';

export interface OptionsData {
    appVersion: string;
    username: string | null;
    forwarderDomain: string;
    isRateVisible: boolean;
    isPremiumFeaturesShow: boolean;
    webRTCEnabled: boolean;
    contextMenusEnabled: boolean;
    helpUsImprove: boolean;
    dnsServer: string;
    appearanceTheme: AppearanceTheme;
    isPremiumToken: boolean;
    exclusionsData: ExclusionsData;
    servicesData: ServiceDto[];
    isAuthenticated: boolean;
    isAllExclusionsListsEmpty: boolean;
    maxDevicesCount?: number;
    pageId: string | null;
    subscriptionType: SubscriptionType | null;
    subscriptionTimeExpiresIso: string | null;
    customDnsServers: DnsServerData[];
    quickConnectSetting: QuickConnectSetting;
    selectedLanguage: LocalePreference;
}

export class SettingsStore {
    @observable public isRateVisible = true;

    @observable public isPremiumToken: boolean;

    @observable public premiumFeatures = true;

    @observable public appVersion: string;

    @observable public currentUsername: string | null;

    @observable public forwarderDomain: string;

    @observable public webRTCEnabled = false;

    @observable public appearanceTheme: AppearanceTheme = APPEARANCE_THEME_DEFAULT;

    @observable public contextMenusEnabled = false;

    @observable public helpUsImprove = false;

    @observable public dnsServer = DEFAULT_DNS_SERVER.id;

    @observable public dnsServerToEdit: DnsServerData | null = null;

    @observable public isCustomDnsModalOpen = false;

    @observable public isHelpUsImproveModalOpen = false;

    @observable public isSignOutModalOpen = false;

    @observable public customDnsServers: DnsServerData[] = [];

    @observable public invitesBonuses = {
        inviteUrl: '',
        invitesCount: 0,
        maxInvitesCount: 0,
    };

    @observable public multiplatformBonus = {
        available: false,
    };

    @observable public bonusesDataRequestStatus: string;

    @observable public subscriptionType: SubscriptionType | null = null;

    @observable public subscriptionTimeExpiresIso: string | null = null;

    @observable public showBugReporter = false;

    @observable public showDnsSettings = false;

    @observable public quickConnect = QUICK_CONNECT_SETTING_DEFAULT;

    @observable public selectedLanguage: LocalePreference = LANGUAGE_AUTO;

    @observable public dnsServerName = '';

    @observable public dnsServerAddress = '';

    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    /**
     * Updates the selected language preference observable.
     *
     * Called by {@link changeLanguage} and by the notifier handler when
     * another options tab changes the language.
     *
     * @param language Locale code (e.g. 'de') or 'auto'.
     */
    @action
    public setSelectedLanguage(language: LocalePreference): void {
        this.selectedLanguage = language;
    }

    /**
     * Full language-change flow initiated by the user.
     *
     * Persists the preference via the background script (which also
     * broadcasts {@link LANGUAGE_CHANGED} to other contexts), updates the
     * dropdown observable, and loads the new locale into the shared
     * {@link TranslationStore}.
     *
     * @param language Locale code (e.g. 'de') or 'auto'.
     */
    public async changeLanguage(language: LocalePreference): Promise<void> {
        await messenger.setInterfaceLanguage(language);
        this.setSelectedLanguage(language);
        await this.rootStore.translationStore.setLocalePreference(language);
    }

    @action
    public async requestIsPremiumToken(): Promise<void> {
        const isPremiumToken = await messenger.checkIsPremiumToken();
        runInAction(() => {
            this.isPremiumToken = isPremiumToken;
        });
    }

    @action public hideRate = async (): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action public hidePremiumFeatures = async (): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.PREMIUM_FEATURES_SHOW, false);
        runInAction(() => {
            this.premiumFeatures = false;
        });
    };

    @action public disableProxy = async (): Promise<void> => {
        await messenger.disableProxy(true);
    };

    @action public setWebRTCValue = async (value: boolean): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED, value);
        runInAction(() => {
            this.webRTCEnabled = value;
        });
    };

    @action public setAppearanceTheme = async (value: AppearanceTheme): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.APPEARANCE_THEME, value);
        runInAction(() => {
            this.appearanceTheme = value;
        });
    };

    @action public setContextMenusValue = async (value: boolean): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED, value);
        runInAction(() => {
            this.contextMenusEnabled = value;
        });
    };

    @action public setHelpUsImproveValue = async (value: boolean): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.HELP_US_IMPROVE, value);
        runInAction(() => {
            this.helpUsImprove = value;
        });
    };

    @action public setDnsServer = async (value: string): Promise<void> => {
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

    @action public setOptionsData = (data: OptionsData): void => {
        this.appVersion = data.appVersion;
        this.currentUsername = data.username;
        this.forwarderDomain = data.forwarderDomain;
        this.isRateVisible = data.isRateVisible;
        this.premiumFeatures = data.isPremiumFeaturesShow;
        this.webRTCEnabled = data.webRTCEnabled;
        this.contextMenusEnabled = data.contextMenusEnabled;
        this.helpUsImprove = data.helpUsImprove;
        this.dnsServer = data.dnsServer;
        this.appearanceTheme = data.appearanceTheme;
        this.subscriptionType = data.subscriptionType;
        this.subscriptionTimeExpiresIso = data.subscriptionTimeExpiresIso;
        this.customDnsServers = data.customDnsServers;
        this.quickConnect = data.quickConnectSetting;
        this.selectedLanguage = data.selectedLanguage;
    };

    @action public updateCurrentUsername = async (): Promise<void> => {
        const currentUsername = await messenger.getUsername();
        runInAction(() => {
            this.currentUsername = currentUsername;
        });
    };

    @action public updateBonusesData = async (): Promise<void> => {
        this.bonusesDataRequestStatus = RequestStatus.Pending;
        const bonusesData = await messenger.getBonusesData();

        if (!bonusesData) {
            log.warn('[vpn.SettingsStore]: Available bonuses data request failed');
            this.bonusesDataRequestStatus = RequestStatus.Error;
            return;
        }

        const { invitesBonuses, multiplatformBonus } = bonusesData;

        runInAction(() => {
            this.invitesBonuses = {
                inviteUrl: invitesBonuses.inviteUrl,
                invitesCount: invitesBonuses.invitesCount,
                maxInvitesCount: invitesBonuses.maxInvitesCount,
            };
            this.multiplatformBonus.available = multiplatformBonus.available;
            this.bonusesDataRequestStatus = RequestStatus.Done;
        });
    };

    @action public openPremiumPromoPage = async (): Promise<void> => {
        await messenger.openPremiumPromoPage();
    };

    @action public openPromoteSocialsPage = async (): Promise<void> => {
        await messenger.openPromoteSocialsPage();
    };

    @action private setCustomDnsServers = (dnsServersData: DnsServerData[]): void => {
        this.customDnsServers = dnsServersData;
    };

    @action public addCustomDnsServer = async (
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<void> => {
        log.info(`[vpn.SettingsStore]: Adding DNS server: ${dnsServerName} with address: ${dnsServerAddress}`);
        const dnsServer = {
            id: nanoid(),
            title: dnsServerName,
            address: dnsServerAddress,
        };
        this.customDnsServers.push(dnsServer);
        await messenger.addCustomDnsServer(dnsServer);
        await this.setDnsServer(dnsServer.id);
    };

    @action public editCustomDnsServer = async (
        dnsServerId: string,
        dnsServerName: string,
        dnsServerAddress: string,
    ): Promise<void> => {
        const editedDnsServers = await messenger.editCustomDnsServer({
            id: dnsServerId,
            title: dnsServerName,
            address: dnsServerAddress,
        });

        this.setCustomDnsServers(editedDnsServers);
        this.setDnsServerToEdit(null);
    };

    @action public removeCustomDnsServer = async (dnsServerId: string): Promise<void> => {
        this.customDnsServers = this.customDnsServers.filter((server) => server.id !== dnsServerId);
        await messenger.removeCustomDnsServer(dnsServerId);
        if (this.dnsServer === dnsServerId) {
            await this.setDnsServer(DEFAULT_DNS_SERVER.id);
        }
    };

    @action public restoreCustomDnsServersData = async (): Promise<void> => {
        const customDnsServersData = await messenger.restoreCustomDnsServersData();
        runInAction(() => {
            this.customDnsServers = customDnsServersData;
        });
    };

    @action public setDnsServerToEdit = (value: DnsServerData | null): void => {
        if (value) {
            this.dnsServerName = value.title;
            this.dnsServerAddress = value.address;
        }

        this.dnsServerToEdit = value;
    };

    @action public openCustomDnsModal = (): void => {
        this.isCustomDnsModalOpen = true;
    };

    @action public closeCustomDnsModal = (): void => {
        this.isCustomDnsModalOpen = false;
    };

    @action public openHelpUsImproveModal = (): void => {
        this.isHelpUsImproveModalOpen = true;
    };

    @action public closeHelpUsImproveModal = (): void => {
        this.isHelpUsImproveModalOpen = false;
    };

    @action public openSignOutModal = (): void => {
        this.isSignOutModalOpen = true;
    };

    @action public closeSignOutModal = (): void => {
        this.isSignOutModalOpen = false;
    };

    /**
     * Handles custom dns data send after user clicked to the custom url
     */
    @action public handleCustomDnsData = ({ name, address }: CustomDnsData): void => {
        this.setShowDnsSettings(true);
        this.openCustomDnsModal();
        this.setDnsServerName(name);
        this.setDnsServerAddress(address);
    };

    @computed public get currentDnsServerName(): string | null {
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

    @action public setShowBugReporter = (value: boolean): void => {
        this.showBugReporter = value;
    };

    @action public setShowDnsSettings = (value: boolean): void => {
        this.showDnsSettings = value;
    };

    /**
     * Hides components rendered on separate screens without routing:
     * DNS settings and Bug Reporter
     */
    @action public closeSubComponents = (): void => {
        this.setShowBugReporter(false);
        this.setShowDnsSettings(false);
    };

    @action public setQuickConnectSetting = async (value: QuickConnectSetting): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.QUICK_CONNECT, value);
        runInAction(() => {
            this.quickConnect = value;
        });
    };

    @computed public get invitesQuestCompleted(): boolean {
        return this.invitesBonuses.invitesCount >= this.invitesBonuses.maxInvitesCount;
    }

    @computed public get addDeviceQuestCompleted(): boolean {
        return !this.multiplatformBonus.available;
    }

    @computed public get allQuestsCompleted(): boolean {
        return this.invitesQuestCompleted && this.addDeviceQuestCompleted;
    }

    @action public setDnsServerName = (name: string): void => {
        this.dnsServerName = name;
    };

    @action public setDnsServerAddress = (address: string): void => {
        this.dnsServerAddress = address;
    };
}
