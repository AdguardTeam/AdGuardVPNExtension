import {
    action,
    observable,
    runInAction,
} from 'mobx';
import punycode from 'punycode/';

import { log } from '../../lib/logger';
import { SETTINGS_IDS, APPEARANCE_THEME_DEFAULT } from '../../lib/constants';
import { DNS_DEFAULT } from '../../background/dns/dnsConstants';
import messenger from '../../lib/messenger';
import { EXCLUSIONS_MODES } from '../../background/exclusions/exclusionsConstants';

export class SettingsStore {
    @observable exclusions = {
        [EXCLUSIONS_MODES.SELECTIVE]: [],
        [EXCLUSIONS_MODES.REGULAR]: [],
    };

    @observable exclusionsInputs = {
        [EXCLUSIONS_MODES.SELECTIVE]: '',
        [EXCLUSIONS_MODES.REGULAR]: '',
    };

    @observable exclusionsCheckboxes = {
        [EXCLUSIONS_MODES.SELECTIVE]: true,
        [EXCLUSIONS_MODES.REGULAR]: true,
    };

    @observable areFormsVisible = {
        [EXCLUSIONS_MODES.SELECTIVE]: false,
        [EXCLUSIONS_MODES.REGULAR]: false,
    };

    @observable isRateVisible = true;

    @observable appVersion;

    @observable currentUsername;

    @observable exclusionsCurrentMode;

    @observable webRTCEnabled = false;

    @observable appearanceTheme = APPEARANCE_THEME_DEFAULT;

    @observable contextMenusEnabled = false;

    @observable helpUsImprove = false;

    @observable dnsServer = DNS_DEFAULT;

    @observable referralLink = '';

    @observable referralPartners = 0;

    @action
    getExclusions = async () => {
        const exclusionsData = await messenger.getExclusionsData();
        runInAction(() => {
            this.exclusions[EXCLUSIONS_MODES.REGULAR] = exclusionsData.regular;
            this.exclusions[EXCLUSIONS_MODES.SELECTIVE] = exclusionsData.selective;
            this.exclusionsCurrentMode = exclusionsData.currentMode;
        });
    };

    @action
    setExclusions = (exclusions) => {
        this.exclusions[EXCLUSIONS_MODES.REGULAR] = exclusions.regular;
        this.exclusions[EXCLUSIONS_MODES.SELECTIVE] = exclusions.selective;
        this.exclusionsCurrentMode = exclusions.currentMode;
    };

    @action
    removeFromExclusions = async (mode, id) => {
        try {
            await messenger.removeExclusionByMode(mode, id);
        } catch (e) {
            log.error(e);
        }
    };

    @action
    deleteCurrentModeExclusions = async () => {
        try {
            await messenger.removeExclusionsByMode(this.exclusionsCurrentMode);
        } catch (e) {
            log.error(e);
        }
    };

    @action
    toggleExclusion = async (mode, id) => {
        try {
            await messenger.toggleExclusionByMode(mode, id);
        } catch (e) {
            log.error(e);
        }
    };

    @action
    renameExclusion = async (mode, id, name) => {
        try {
            await messenger.renameExclusionByMode(mode, id, name);
        } catch (e) {
            log.error(e);
        }
    };

    isAddingExclusions = false;

    @action
    addToExclusions = async (mode) => {
        this.isAddingExclusions = true;
        try {
            const url = this.exclusionsInputs[mode];
            const enabled = this.exclusionsCheckboxes[mode];
            await messenger.addExclusionByMode(mode, url.trim(), enabled);
            await this.getExclusions();
            runInAction(() => {
                this.areFormsVisible[mode] = false;
                this.exclusionsInputs[mode] = '';
                this.exclusionsCheckboxes[mode] = true;
                this.isAddingExclusions = false;
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    onExclusionsInputChange = (exclusionsType, value) => {
        this.exclusionsInputs[exclusionsType] = value;
    };

    @action
    onExclusionsCheckboxChange = (exclusionsType, value) => {
        this.exclusionsCheckboxes[exclusionsType] = value;
    };

    @action
    openExclusionsForm = (exclusionsType) => {
        this.areFormsVisible[exclusionsType] = true;
    };

    @action
    closeExclusionsForm = (exclusionsType) => {
        this.areFormsVisible[exclusionsType] = false;
        this.exclusionsInputs[exclusionsType] = '';
        this.exclusionsCheckboxes[exclusionsType] = true;
    };

    @action
    hideRate = async () => {
        await messenger.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action
    disableProxy = async () => {
        await messenger.disableProxy(true);
    };

    @action
    toggleInverted = async (mode) => {
        this.exclusionsCurrentMode = mode;
        await messenger.setExclusionsMode(mode);
    };

    unicodeExclusionsByType(exclusionsType) {
        return this.exclusions[exclusionsType]
            .slice()
            .reverse()
            .map((ex) => ({ ...ex, unicodeHostname: punycode.toUnicode(ex.hostname) }));
    }

    @action
    setWebRTCValue = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED, value);
        runInAction(() => {
            this.webRTCEnabled = value;
        });
    };

    @action
    setAppearanceTheme = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.APPEARANCE_THEME, value);
        runInAction(() => {
            this.appearanceTheme = value;
        });
    };

    @action
    setContextMenusValue = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED, value);
        runInAction(() => {
            this.contextMenusEnabled = value;
        });
    };

    @action
    setHelpUsImproveValue = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.HELP_US_IMPROVE, value);
        runInAction(() => {
            this.helpUsImprove = value;
        });
    };

    @action
    setDnsServer = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.SELECTED_DNS_SERVER, value);
        runInAction(() => {
            this.dnsServer = value;
        });
    };

    @action
    setOptionsData = (data) => {
        this.appVersion = data.appVersion;
        this.currentUsername = data.username;
        this.isRateVisible = data.isRateVisible;
        this.webRTCEnabled = data.webRTCEnabled;
        this.contextMenusEnabled = data.contextMenusEnabled;
        this.helpUsImprove = data.helpUsImprove;
        this.dnsServer = data.dnsServer;
        this.appearanceTheme = data.appearanceTheme;
        this.setExclusions(data.exclusionsData);
    };

    @action
    updateReferralData = async () => {
        const referralData = await messenger.getReferralData();
        const { referralLink, referralPartners, referralPartnersLimit } = referralData;
        runInAction(() => {
            this.referralLink = referralLink;
            this.referralPartners = referralPartners;
            this.referralPartnersLimit = referralPartnersLimit;
        });
    };
}
