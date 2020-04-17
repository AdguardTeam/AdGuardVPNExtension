import {
    action,
    observable,
    runInAction,
    toJS,
} from 'mobx';

import log from '../../../lib/logger';
import { SETTINGS_IDS } from '../../../lib/constants';
import { DNS_DEFAULT } from '../../../background/dns/dnsConstants';
import messager from '../../../lib/messager';
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
        const exclusionsData = await messager.getExclusionsData();
        runInAction(() => {
            this.exclusions[EXCLUSIONS_MODES.REGULAR] = exclusionsData.regular;
            this.exclusions[EXCLUSIONS_MODES.SELECTIVE] = exclusionsData.selective;
            this.exclusionsCurrentMode = exclusionsData.currentMode;
        });
    };

    @action
    removeFromExclusions = async (exclusionsType, hostName) => {
        const handler = adguard.exclusions.getHandler(exclusionsType);
        try {
            await handler.removeFromExclusions(hostName);
        } catch (e) {
            log.error(e);
        }
    };

    @action
    toggleExclusion = async (exclusionsType, id) => {
        const handler = adguard.exclusions.getHandler(exclusionsType);
        try {
            await handler.toggleExclusion(id);
        } catch (e) {
            log.error(e);
        }
    };

    @action
    renameExclusion = async (exclusionsType, id, name) => {
        const handler = adguard.exclusions.getHandler(exclusionsType);
        try {
            await handler.renameExclusion(id, name);
        } catch (e) {
            log.error(e);
        }
    };

    @action
    addToExclusions = async (exclusionsType) => {
        const handler = adguard.exclusions.getHandler(exclusionsType);
        try {
            await handler.addToExclusions(
                this.exclusionsInputs[exclusionsType],
                this.exclusionsCheckboxes[exclusionsType]
            );
            runInAction(() => {
                this.areFormsVisible[exclusionsType] = false;
                this.exclusionsInputs[exclusionsType] = '';
                this.exclusionsCheckboxes[exclusionsType] = true;
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
        this.appVersion = await messager.getAppVersion();
    };

    @action
    getUsername = async () => {
        const username = await messager.getUsername();

        runInAction(() => {
            this.currentUsername = username;
        });
    };

    @action
    checkRateStatus = async () => {
        const value = await messager.getSetting(SETTINGS_IDS.RATE_SHOW);
        runInAction(() => {
            this.isRateVisible = value;
        });
    };

    @action
    hideRate = async () => {
        await messager.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action
    disableProxy = async () => {
        await messager.disableProxy(true, true);
    };

    @action
    toggleInverted = async (type) => {
        this.exclusionsCurrentMode = type;
        await adguard.exclusions.setCurrentMode(type);
    };

    exclusionsByType(exclusionsType) {
        return toJS(this.exclusions[exclusionsType]);
    }

    @action
    setWebRTCValue = async (value) => {
        await messager.setSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED, value);
        runInAction(() => {
            this.webRTCEnabled = value;
        });
    };

    @action
    getWebRTCValue = async () => {
        const value = await messager.getSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED);
        runInAction(() => {
            this.webRTCEnabled = value;
        });
    };

    @action
    setContextMenusValue = async (value) => {
        await messager.setSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED, value);
        runInAction(() => {
            this.contextMenusEnabled = value;
        });
    };

    @action
    getContextMenusEnabled = async () => {
        const value = await messager.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
        runInAction(() => {
            this.contextMenusEnabled = value;
        });
    };

    @action
    setDnsServer = async (value) => {
        await messager.setSetting(SETTINGS_IDS.SELECTED_DNS_SERVER, value);
        runInAction(() => {
            this.dnsServer = value;
        });
    };

    @action
    getDnsServer = async () => {
        const value = await messager.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER);
        runInAction(() => {
            this.dnsServer = value;
        });
    };
}

export default SettingsStore;
