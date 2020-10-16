import {
    action,
    observable,
    runInAction,
    toJS,
} from 'mobx';

import { log } from '../../../lib/logger';
import { SETTINGS_IDS } from '../../../lib/constants';
import { DNS_DEFAULT } from '../../../background/dns/dnsConstants';
import messenger from '../../../lib/messenger';
import { EXCLUSIONS_MODES } from '../../../background/exclusions/exclusionsConstants';

class SettingsStore {
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

    @observable contextMenusEnabled = false;

    @observable dnsServer = DNS_DEFAULT;

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
    removeFromExclusions = async (mode, id) => {
        try {
            await messenger.removeExclusionByMode(mode, id);
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

    @action
    addToExclusions = async (mode) => {
        try {
            const url = this.exclusionsInputs[mode];
            const enabled = this.exclusionsCheckboxes[mode];
            await messenger.addExclusionByMode(mode, url, enabled);
            runInAction(() => {
                this.areFormsVisible[mode] = false;
                this.exclusionsInputs[mode] = '';
                this.exclusionsCheckboxes[mode] = true;
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
    getVersion = async () => {
        this.appVersion = await messenger.getAppVersion();
    };

    @action
    getUsername = async () => {
        const username = await messenger.getUsername();

        runInAction(() => {
            this.currentUsername = username;
        });
    };

    @action
    checkRateStatus = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.RATE_SHOW);
        runInAction(() => {
            this.isRateVisible = value;
        });
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
        await messenger.disableProxy(true, true);
    };

    @action
    toggleInverted = async (mode) => {
        this.exclusionsCurrentMode = mode;
        await messenger.setExclusionsMode(mode);
    };

    exclusionsByType(exclusionsType) {
        return toJS(this.exclusions[exclusionsType]);
    }

    @action
    setWebRTCValue = async (value) => {
        await messenger.setSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED, value);
        runInAction(() => {
            this.webRTCEnabled = value;
        });
    };

    @action
    getWebRTCValue = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED);
        runInAction(() => {
            this.webRTCEnabled = value;
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
    getContextMenusEnabled = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
        runInAction(() => {
            this.contextMenusEnabled = value;
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
    getDnsServer = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER);
        runInAction(() => {
            this.dnsServer = value;
        });
    };
}

export default SettingsStore;
