import browserApi from './browserApi';
import { updateService } from './updateService';
import { FLAGS_FIELDS, PROMO_SCREEN_STATES } from '../lib/constants';

const FLAGS_STORAGE_KEY = 'flags.storage';

const DEFAULTS = {
    [FLAGS_FIELDS.SHOW_ONBOARDING]: true,
    [FLAGS_FIELDS.SHOW_UPGRADE_SCREEN]: true,
    [FLAGS_FIELDS.SALE_SHOW]: PROMO_SCREEN_STATES.DISPLAY_AFTER_CONNECT_CLICK,
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
        flagsStorageData[key] = value;
        await browserApi.storage.set(FLAGS_STORAGE_KEY, flagsStorageData);
    };

    /**
     * Gets value from flags storage by key name
     */
    get = async (key) => {
        const flagsStorageData = await browserApi.storage.get(FLAGS_STORAGE_KEY);
        return flagsStorageData[key];
    };

    /**
     * Sets default values for flags
     */
    setDefaults = async () => {
        const flagsStorageData = await this.getFlagsStorageData();
        Object.keys(DEFAULTS).forEach((key) => {
            flagsStorageData[key] = DEFAULTS[key];
        });
        await browserApi.storage.set(FLAGS_STORAGE_KEY, flagsStorageData);
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
        await updateService.setIsFirstRun(false);
    };

    init = async () => {
        await browserApi.storage.set(FLAGS_STORAGE_KEY, {});
        await this.setDefaults();
    };
}

export const flagsStorage = new FlagsStorage();
