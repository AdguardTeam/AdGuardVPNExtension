import { FLAGS_FIELDS } from '../common/constants';
import { log } from '../common/logger';

import { browserApi } from './browserApi';
import { updateService } from './updateService';
import { type FlagsStorageData, FLAG_STORAGE_DEFAULTS } from './flagsStorageData';

const FLAGS_STORAGE_KEY = 'flags.storage';

export interface FlagsStorageInterface {
    /**
     * Sets value to flags storage for provided key
     */
    set(key: string, value: boolean): Promise<void>;

    /**
     * Sets default values for flags to storage
     */
    setDefaults(): Promise<void>;

    /**
     * Returns object with all flags values { flag_key: value }
     *
     * @returns Flags storage data.
     */
    getFlagsStorageData(): Promise<FlagsStorageData>;

    /**
     * Sets flags when new user registered
     */
    onRegister(): Promise<void>;

    /**
     * Sets flags when new user authenticated
     */
    onAuthenticate(): Promise<void>;

    /**
     * Sets flags when new user deauthenticated
     */
    onDeauthenticate(): Promise<void>;

    /**
     * Initialize flags storage.
     */
    init(): Promise<void>
}

/**
 * Manages flags data in storage
 */
class FlagsStorage implements FlagsStorageInterface {
    /**
     * Flags storage data.
     */
    private flagsStorageData: FlagsStorageData | null = null;

    /** @inheritdoc */
    set = async (key: string, value: boolean): Promise<void> => {
        if (!this.flagsStorageData) {
            log.error('[vpn.FlagsStorage]: Unable to get flags data from storage');
            return;
        }
        this.flagsStorageData[key] = value;
        await browserApi.storage.set(FLAGS_STORAGE_KEY, this.flagsStorageData);
    };

    /** @inheritdoc */
    setDefaults = async (): Promise<void> => {
        this.flagsStorageData = { ...FLAG_STORAGE_DEFAULTS };
        await browserApi.storage.set(FLAGS_STORAGE_KEY, this.flagsStorageData);
    };

    /** @inheritdoc */
    getFlagsStorageData = async (): Promise<FlagsStorageData> => {
        if (!this.flagsStorageData) {
            await this.setDefaults();
        }

        // Note: `flagsStorageData` is guaranteed to be defined here
        // because `setDefaults` initializes it with default values
        return this.flagsStorageData!;
    };

    /** @inheritdoc */
    onRegister = async (): Promise<void> => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, true);
    };

    /** @inheritdoc */
    onAuthenticate = async (): Promise<void> => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, false);
    };

    /** @inheritdoc */
    onDeauthenticate = async (): Promise<void> => {
        await this.setDefaults();
        await updateService.setIsFirstRunFalse();
    };

    /** @inheritdoc */
    init = async (): Promise<void> => {
        if (!this.flagsStorageData) {
            await this.setDefaults();
        }
    };
}

export const flagsStorage = new FlagsStorage();
