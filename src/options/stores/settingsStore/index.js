import {
    action,
    observable,
    runInAction,
    toJS,
} from 'mobx';

import log from '../../../lib/logger';
import { SETTINGS_IDS } from '../../../lib/constants';

class SettingsStore {
    @observable exclusions = {
        [adguard.exclusions.TYPES.WHITELIST]: [],
        [adguard.exclusions.TYPES.BLACKLIST]: [],
    };

    @observable exclusionsInputs = {
        [adguard.exclusions.TYPES.WHITELIST]: '',
        [adguard.exclusions.TYPES.BLACKLIST]: '',
    };

    @observable exclusionsCheckboxes = {
        [adguard.exclusions.TYPES.WHITELIST]: true,
        [adguard.exclusions.TYPES.BLACKLIST]: true,
    };

    @observable areFormsVisible = {
        [adguard.exclusions.TYPES.WHITELIST]: false,
        [adguard.exclusions.TYPES.BLACKLIST]: false,
    };

    @observable isRateVisible = true;

    @observable appVersion;

    @observable currentUsername;

    @observable currentExclusionsType;

    @observable webRTCEnabled = false;

    @observable DNSEnabled = false;

    @observable DNSType = 'default';

    // Options page actions
    @action
    getExclusions = () => {
        const {
            TYPES, whitelist, blacklist, current,
        } = adguard.exclusions;
        this.exclusions[TYPES.BLACKLIST] = blacklist.getExclusionsList();
        this.exclusions[TYPES.WHITELIST] = whitelist.getExclusionsList();
        this.currentExclusionsType = current.type;
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
    getVersion = () => {
        this.appVersion = adguard.appStatus.version;
    };

    @action
    getUsername = async () => {
        const username = await adguard.credentials.getUsername();

        runInAction(() => {
            this.currentUsername = username;
        });
    };

    @action
    checkRateStatus = async () => {
        const value = await adguard.settings.getSetting(SETTINGS_IDS.RATE_SHOW);
        runInAction(() => {
            this.isRateVisible = value;
        });
    };

    @action
    hideRate = async () => {
        await adguard.settings.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action
    disableProxy = async () => {
        await adguard.settings.disableProxy(true, true);
    };

    @action
    toggleInverted = async (type) => {
        this.currentExclusionsType = type;
        await adguard.exclusions.setCurrentHandler(type);
    };

    exclusionsByType(exclusionsType) {
        return toJS(this.exclusions[exclusionsType]);
    }

    @action
    setWebRTC = async (value) => {
        await adguard.settings.setSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED, value);
        runInAction(() => {
            this.webRTCEnabled = value;
        });
    };

    @action
    getWebRTCValue = async () => {
        const value = await adguard.settings.getSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED);
        this.setWebRTC(value);
    };

    @action
    setDNSUsage = async (value) => {
        await adguard.settings.setSetting(SETTINGS_IDS.HANDLE_DNS_ENABLED, value);
        runInAction(() => {
            this.DNSEnabled = value;
        });
    };

    @action
    getDNSUsage = async () => {
        const value = await adguard.settings.getSetting(SETTINGS_IDS.HANDLE_DNS_ENABLED);
        this.setDNSUsage(value);
    };

    @action
    setDNSType = async (value) => {
        await adguard.settings.setSetting(SETTINGS_IDS.HANDLE_DNS_TYPE, value);
        runInAction(() => {
            this.DNSType = value;
        });
    };

    @action
    getDNSType = async () => {
        const value = await adguard.settings.getSetting(SETTINGS_IDS.HANDLE_DNS_TYPE);
        this.setDNSType(value);
    };
}

export default SettingsStore;
