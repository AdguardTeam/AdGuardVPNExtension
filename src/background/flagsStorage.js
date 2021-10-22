import browserApi from './browserApi';
import { updateService } from './updateService';
import { FLAGS_KEYS, PROMO_SCREEN_STATES } from '../lib/constants';

const DEFAULTS = {
    [FLAGS_KEYS.SHOW_ONBOARDING]: true,
    [FLAGS_KEYS.SHOW_UPGRADE_SCREEN]: true,
    [FLAGS_KEYS.SALE_SHOW]: PROMO_SCREEN_STATES.DISPLAY_AFTER_CONNECT_CLICK,
};

/**
 * Manages flags data in storage
 */
class FlagsStorage {
    /**
     * Sets value to storage for provided key
     */
    set = async (key, value) => {
        await browserApi.storage.set(key, value);
    };

    /**
     * Gets value to storage by key
     */
    get = async (key) => {
        return browserApi.storage.get(key);
    };

    /**
     * Sets default values for flags
     */
    setDefaults = async () => {
        const defaults = [];
        Object.keys(DEFAULTS).forEach((key) => {
            defaults.push(this.set(key, DEFAULTS[key]));
        });
        await Promise.all(defaults);
    };

    /**
     * Returns object with all flags values { flag_key: value }
     */
    getFlagsStorageData = async () => {
        const flagsKeys = Object.values(FLAGS_KEYS);
        const flagsValues = flagsKeys.map((key) => this.get(key));
        const flagsStorageData = await Promise.all(flagsValues);

        return Object.fromEntries(flagsKeys
            .map((_, i) => [flagsKeys[i], flagsStorageData[i]]));
    };

    /**
     * Sets flags when new user registered
     */
    onRegister = async () => {
        await Promise.all([
            this.set(FLAGS_KEYS.IS_NEW_USER, true),
            this.set(FLAGS_KEYS.IS_SOCIAL_AUTH, false),
        ]);
    };

    /**
     * Sets flags when new user authenticated
     */
    onAuthenticate = async () => {
        await Promise.all([
            this.set(FLAGS_KEYS.IS_NEW_USER, false),
            this.set(FLAGS_KEYS.IS_SOCIAL_AUTH, false),
        ]);
    };

    /**
     * Sets flags when new user authenticated using social net provider
     */
    onAuthenticateSocial = async () => {
        await Promise.all([
            this.set(FLAGS_KEYS.IS_NEW_USER, false),
            this.set(FLAGS_KEYS.IS_SOCIAL_AUTH, true),
        ]);
    };

    /**
     * Sets flags when new user deauthenticated
     */
    onDeauthenticate = async () => {
        await this.setDefaults();
        await updateService.setIsFirstRun(false);
    };

    init = async () => {
        await this.setDefaults();
    };
}

export const flagsStorage = new FlagsStorage();
