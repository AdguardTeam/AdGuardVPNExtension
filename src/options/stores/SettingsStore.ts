import {
    action,
    observable,
    runInAction,
    computed,
} from 'mobx';

import {
    SETTINGS_IDS,
    type AppearanceTheme,
    APPEARANCE_THEME_DEFAULT,
    type SubscriptionType,
    type QuickConnectSetting,
    QUICK_CONNECT_SETTING_DEFAULT,
} from '../../common/constants';
import { type LocalePreference, LANGUAGE_AUTO } from '../../common/locale';
import { messenger } from '../../common/messenger';
import { log } from '../../common/logger';
import type { DnsServerData } from '../../background/schema';
import { type LocationWithPingInterface } from '../../background/endpoints/LocationWithPing';

import type { RootStore } from './RootStore';
import { RequestStatus } from './consts';

export interface OptionsData {
    appVersion: string;
    username: string | null;
    forwarderDomain: string;
    isRateVisible: boolean;
    isPremiumFeaturesShow: boolean;
    contextMenusEnabled: boolean;
    helpUsImprove: boolean;
    dnsServer: string;
    appearanceTheme: AppearanceTheme;
    isPremiumToken: boolean;
    isAuthenticated: boolean;
    maxDevicesCount?: number;
    pageId: string | null;
    subscriptionType: SubscriptionType | null;
    subscriptionTimeExpiresIso: string | null;
    customDnsServers: DnsServerData[];
    quickConnectSetting: QuickConnectSetting;
    selectedLanguage: LocalePreference;
    locations: LocationWithPingInterface[];
}

export class SettingsStore {
    @observable public isRateVisible = true;

    @observable public isPremiumToken: boolean;

    @observable public premiumFeatures = true;

    @observable public appVersion: string;

    @observable public currentUsername: string | null;

    @observable public forwarderDomain: string;

    @observable public appearanceTheme: AppearanceTheme = APPEARANCE_THEME_DEFAULT;

    @observable public contextMenusEnabled = false;

    @observable public helpUsImprove = false;

    @observable public isHelpUsImproveModalOpen = false;

    @observable public isSignOutModalOpen = false;

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

    @observable public quickConnect = QUICK_CONNECT_SETTING_DEFAULT;

    @observable public selectedLanguage: LocalePreference = LANGUAGE_AUTO;

    @observable public locations: LocationWithPingInterface[] = [];

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

    @action public setOptionsData = (data: OptionsData): void => {
        this.appVersion = data.appVersion;
        this.currentUsername = data.username;
        this.forwarderDomain = data.forwarderDomain;
        this.isRateVisible = data.isRateVisible;
        this.premiumFeatures = data.isPremiumFeaturesShow;
        this.contextMenusEnabled = data.contextMenusEnabled;
        this.helpUsImprove = data.helpUsImprove;
        this.appearanceTheme = data.appearanceTheme;
        this.subscriptionType = data.subscriptionType;
        this.subscriptionTimeExpiresIso = data.subscriptionTimeExpiresIso;
        this.quickConnect = data.quickConnectSetting;
        this.selectedLanguage = data.selectedLanguage;
        this.locations = data.locations;
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

    @action public setShowBugReporter = (value: boolean): void => {
        this.showBugReporter = value;
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
}
