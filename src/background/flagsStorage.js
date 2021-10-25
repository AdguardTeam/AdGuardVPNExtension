import browserApi from './browserApi';
import { updateService } from './updateService';
import { FLAGS_FIELDS, PROMO_SCREEN_STATES } from '../lib/constants';
import { log } from '../lib/logger';

const FLAGS_STORAGE_KEY = 'flags.storage';

const DEFAULTS = {
    // onboarding should be displayed for new users and on first run (AG-10009)
    [FLAGS_FIELDS.SHOW_ONBOARDING]: true,
    // upgrade screen should be displayed for non-premium users after onboarding screen
    [FLAGS_FIELDS.SHOW_UPGRADE_SCREEN]: true,
    // promo screen should be displayed if non-premium user clicks on connect button
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
        if (!flagsStorageData) {
            log.error('Unable to get flags data from storage');
            return;
        }
        flagsStorageData[key] = value;
        await browserApi.storage.set(FLAGS_STORAGE_KEY, flagsStorageData);
    };

    /**
     * Sets default values for flags
     */
    setDefaults = async () => {
        const flagsStorageData = await this.getFlagsStorageData();
        await browserApi.storage.set(FLAGS_STORAGE_KEY, { ...flagsStorageData, ...DEFAULTS });
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
