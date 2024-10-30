import { FLAGS_FIELDS } from '../common/constants';
import { log } from '../common/logger';

import { browserApi } from './browserApi';
import { updateService } from './updateService';
import { stateStorage } from './stateStorage';
import { type FlagsStorageData, FLAG_STORAGE_DEFAULTS } from './flagsStorageData';
import { StorageKey } from './schema';

const FLAGS_STORAGE_KEY = 'flags.storage';

interface FlagsStorageInterface {
    set(key: string, value: string | boolean): Promise<void>;
    setDefaults(): Promise<void>;
    getFlagsStorageData(): Promise<FlagsStorageData>;
    onRegister(): Promise<void>;
    onAuthenticate(): Promise<void>;
    onDeauthenticate(): Promise<void>;
    init(): Promise<void>
}

/**
 * Manages flags data in storage
 */
class FlagsStorage implements FlagsStorageInterface {
    get flagsStorageData() {
        return stateStorage.getItem(StorageKey.FlagsStorageState);
    }

    set flagsStorageData(value: FlagsStorageData) {
        stateStorage.setItem(StorageKey.FlagsStorageState, value);
    }

    /**
     * Sets value to flags storage for provided key
     */
    set = async (key: string, value: string | boolean): Promise<void> => {
        if (!this.flagsStorageData) {
            log.error('Unable to get flags data from storage');
            return;
        }
        this.flagsStorageData[key] = value;
        await browserApi.storage.set(FLAGS_STORAGE_KEY, this.flagsStorageData);
    };

    /**
     * Sets default values for flags to storage
     */
    setDefaults = async (): Promise<void> => {
        await browserApi.storage.set(FLAGS_STORAGE_KEY, FLAG_STORAGE_DEFAULTS);
    };

    /**
     * Returns object with all flags values { flag_key: value }
     */
    getFlagsStorageData = async (): Promise<FlagsStorageData> => {
        return this.flagsStorageData || await browserApi.storage.get(FLAGS_STORAGE_KEY);
    };

    /**
     * Sets flags when new user registered
     */
    onRegister = async (): Promise<void> => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, true);
        await this.set(FLAGS_FIELDS.IS_SOCIAL_AUTH, false);
    };

    /**
     * Sets flags when new user authenticated
     */
    onAuthenticate = async (): Promise<void> => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, false);
        await this.set(FLAGS_FIELDS.IS_SOCIAL_AUTH, false);
    };

    /**
     * Sets flags when new user authenticated using social net provider
     */
    onAuthenticateSocial = async (): Promise<void> => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, false);
        await this.set(FLAGS_FIELDS.IS_SOCIAL_AUTH, true);
    };

    /**
     * Sets flags when new user deauthenticated
     */
    onDeauthenticate = async (): Promise<void> => {
        await this.setDefaults();
        await updateService.setIsFirstRunFalse();
    };

    init = async (): Promise<void> => {
        if (!this.flagsStorageData) {
            await this.setDefaults();
            this.flagsStorageData = FLAG_STORAGE_DEFAULTS;
        }
    };
}

export const flagsStorage = new FlagsStorage();
