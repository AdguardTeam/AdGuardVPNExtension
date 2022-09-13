import browserApi from './browserApi';
import { FLAGS_FIELDS } from '../lib/constants';
import { log } from '../lib/logger';
import { updateService } from './updateService';

const FLAGS_STORAGE_KEY = 'flags.storage';

const DEFAULTS = {
    // onboarding should be displayed for new users and on first run (AG-10009)
    [FLAGS_FIELDS.SHOW_ONBOARDING]: true,
    // upgrade screen should be displayed for non-premium users after onboarding screen
    [FLAGS_FIELDS.SHOW_UPGRADE_SCREEN]: true,
    [FLAGS_FIELDS.IS_EXTENSION_READY]: false,
};

/**
 * Manages flags data in storage
 */
class FlagsStorage {
    /**
     * Sets value to flags storage for provided key
     */
    set = async (key, value) => {
        const flagsStorageData = await browserApi.storage.get(FLAGS_STORAGE_KEY);
        if (!flagsStorageData) {
            log.error('Unable to get flags data from storage');
            return;
        }
        flagsStorageData[key] = value;
        await browserApi.storage.set(FLAGS_STORAGE_KEY, flagsStorageData);
    };

    /**
     * Gets flags value for provided key
     */
    get = async (key) => {
        const flagsStorageData = await browserApi.storage.get(FLAGS_STORAGE_KEY);
        if (!flagsStorageData) {
            log.error('Unable to get flags data from storage');
            return null;
        }

        return flagsStorageData[key];
    };

    /**
     * Sets default values for flags to storage
     */
    setDefaults = async () => {
        await browserApi.storage.set(FLAGS_STORAGE_KEY, DEFAULTS);
    };

    /**
     * Returns object with all flags values { flag_key: value }
     */
    getFlagsStorageData = async () => {
        return browserApi.storage.get(FLAGS_STORAGE_KEY);
    };

    /**
     * Sets flags when new user registered
     */
    onRegister = async () => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, true);
        await this.set(FLAGS_FIELDS.IS_SOCIAL_AUTH, false);
    };

    /**
     * Sets flags when new user authenticated
     */
    onAuthenticate = async () => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, false);
        await this.set(FLAGS_FIELDS.IS_SOCIAL_AUTH, false);
    };

    /**
     * Sets flags when new user authenticated using social net provider
     */
    onAuthenticateSocial = async () => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, false);
        await this.set(FLAGS_FIELDS.IS_SOCIAL_AUTH, true);
    };

    /**
     * Sets flags when new user deauthenticated
     */
    onDeauthenticate = async () => {
        await this.setDefaults();
        await updateService.setIsFirstRunFalse();
    };

    setExtensionReady = async () => {
        await this.set(FLAGS_FIELDS.IS_EXTENSION_READY, true);
    };

    init = async () => {
        await this.setDefaults();
    };
}

export const flagsStorage = new FlagsStorage();
