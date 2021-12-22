import {
    action,
    observable,
    runInAction,
} from 'mobx';

import { SETTINGS_IDS, APPEARANCE_THEME_DEFAULT } from '../../lib/constants';
import { DNS_DEFAULT } from '../../background/dns/dnsConstants';
import { messenger } from '../../lib/messenger';

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

    @observable nextBillDate;

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
    };

    @action updateCurrentUsername = async () => {
        const currentUsername = await messenger.getUsername();
        runInAction(() => {
            this.currentUsername = currentUsername;
        });
    };

    @action openPremiumPromoPage = async () => {
        await messenger.openPremiumPromoPage();
    };
}
