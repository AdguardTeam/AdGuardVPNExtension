import {
    action,
    observable,
    runInAction,
} from 'mobx';

import log from '../../../lib/logger';
import { SETTINGS_IDS } from '../../../lib/constants';

class SettingsStore {
    @observable exclusions;

    @observable exclusionsInput = '';

    @observable isFormVisible = false;

    @observable isRateVisible = true;

    @observable appVersion;

    @observable currentUsername;

    // Options page actions
    @action
    getExclusions = () => {
        this.exclusions = adguard.exclusions.getExclusions();
    };

    @action
    removeFromExclusions = async (hostName) => {
        try {
            await adguard.exclusions.removeFromExclusions(hostName);
        } catch (e) {
            log.error(e);
        }
    };

    @action
    toggleExclusion = async (id) => {
        try {
            await adguard.exclusions.toggleExclusion(id);
        } catch (e) {
            log.error(e);
        }
    };

    @action
    renameExclusion = async (id, name) => {
        try {
            await adguard.exclusions.renameExclusion(id, name);
        } catch (e) {
            log.error(e);
        }
    };

    @action
    addToExclusions = async () => {
        try {
            await adguard.exclusions.addToExclusions(this.exclusionsInput);
            runInAction(() => {
                this.isFormVisible = false;
                this.exclusionsInput = '';
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    onExclusionsInputChange = (value) => {
        this.exclusionsInput = value;
    };

    @action
    openExclusionsForm = () => {
        this.isFormVisible = true;
    };

    @action
    closeExclusionsForm = () => {
        this.isFormVisible = false;
        this.exclusionsInput = '';
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
        await adguard.settings.setSetting(SETTINGS_IDS.PROXY_ENABLED, false);
    };
}

export default SettingsStore;
