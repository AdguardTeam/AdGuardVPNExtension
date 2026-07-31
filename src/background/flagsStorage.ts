import {
    FLAGS_FIELDS,
    ONBOARDING_GOAL_FLAG,
    ONBOARDING_GOALS,
    type OnboardingGoal,
} from '../common/constants';
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
     * Atomically updates the three mutually exclusive onboarding goal flags
     * and persists them in a single storage write.
     *
     * @param goal Selected goal, or `null` to clear all goal flags.
     */
    setOnboardingGoal(goal: OnboardingGoal | null): Promise<void>;

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

    /**
     * Loads flags from browser storage and merges with defaults so newly added
     * flag keys receive default values without wiping existing ones.
     *
     * @returns Merged flags storage data.
     */
    private async loadFromStorage(): Promise<FlagsStorageData> {
        let stored: FlagsStorageData | undefined;

        try {
            stored = await browserApi.storage.get<FlagsStorageData>(FLAGS_STORAGE_KEY);
        } catch (e) {
            log.error('[vpn.FlagsStorage.loadFromStorage]: Failed to read flags from storage', e);
            return { ...FLAG_STORAGE_DEFAULTS };
        }

        if (!stored || typeof stored !== 'object') {
            return { ...FLAG_STORAGE_DEFAULTS };
        }

        return {
            ...FLAG_STORAGE_DEFAULTS,
            ...stored,
        };
    }

    /**
     * Persists the in-memory flags object to browser storage.
     */
    private async persist(): Promise<void> {
        if (!this.flagsStorageData) {
            return;
        }
        await browserApi.storage.set(FLAGS_STORAGE_KEY, this.flagsStorageData);
    }

    /** @inheritdoc */
    public set = async (key: string, value: boolean): Promise<void> => {
        if (!this.flagsStorageData) {
            log.error('[vpn.FlagsStorage]: Unable to get flags data from storage');
            return;
        }
        this.flagsStorageData[key] = value;
        await this.persist();
    };

    /** @inheritdoc */
    public setDefaults = async (): Promise<void> => {
        this.flagsStorageData = { ...FLAG_STORAGE_DEFAULTS };
        await this.persist();
    };

    /** @inheritdoc */
    public getFlagsStorageData = async (): Promise<FlagsStorageData> => {
        if (!this.flagsStorageData) {
            await this.init();
        }

        // Note: `flagsStorageData` is guaranteed to be defined here
        // because `init` initializes it from storage or defaults
        return this.flagsStorageData!;
    };

    /** @inheritdoc */
    public setOnboardingGoal = async (goal: OnboardingGoal | null): Promise<void> => {
        if (!this.flagsStorageData) {
            await this.init();
        }

        if (!this.flagsStorageData) {
            log.error('[vpn.FlagsStorage]: Unable to set onboarding goal flags');
            return;
        }

        ONBOARDING_GOALS.forEach((key) => {
            this.flagsStorageData![ONBOARDING_GOAL_FLAG[key]] = key === goal;
        });

        await this.persist();
    };

    /** @inheritdoc */
    public onRegister = async (): Promise<void> => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, true);
    };

    /** @inheritdoc */
    public onAuthenticate = async (): Promise<void> => {
        await this.set(FLAGS_FIELDS.IS_NEW_USER, false);
    };

    /** @inheritdoc */
    public onDeauthenticate = async (): Promise<void> => {
        await this.setDefaults();
        await updateService.setIsFirstRunFalse();
    };

    /** @inheritdoc */
    public init = async (): Promise<void> => {
        if (this.flagsStorageData) {
            return;
        }

        const loaded = await this.loadFromStorage();
        this.flagsStorageData = loaded;

        // Persist merge so newly introduced default keys are written once.
        await this.persist();
    };
}

export const flagsStorage = new FlagsStorage();
