import { action, observable, runInAction } from 'mobx';

import { log } from '../logger';

import {
    type AvailableLocale,
    type LocalePreference,
    LANGUAGE_AUTO,
    BASE_LOCALE,
} from './localeConstants';
import { TranslationService } from './TranslationService';

/**
 * Sole owner of MobX-observable locale state for UI contexts.
 *
 * Delegates locale resolution, loading and message lookup to the
 * stateless {@link TranslationService}, while owning all reactive
 * fields (`userLocalePreference`, `currentLocale`, `isLoading`).
 *
 * The background script never instantiates this class — it uses
 * the {@link I18n} facade in standalone mode instead.
 */
export class TranslationStore {
    /**
     * Stateless service used for locale resolution, loading and lookup.
     */
    private service: TranslationService;

    /**
     * User's preference: 'auto' (browser language) or an explicit locale code like 'de'.
     */
    @observable userLocalePreference: LocalePreference = LANGUAGE_AUTO;

    /**
     * The actual resolved locale code currently in use (e.g. 'de').
     * Never equals 'auto'.
     */
    @observable currentLocale: AvailableLocale = BASE_LOCALE;

    /**
     * True while a locale file fetch is in progress.
     */
    @observable isLoading: boolean = false;

    constructor(service?: TranslationService) {
        this.service = service || new TranslationService();
    }

    /**
     * Initializes the store with a saved preference.
     * Loads locale data via the service and sets own observables.
     *
     * @param savedPreference Persisted preference from settings ('auto' or a locale code).
     * Defaults to 'auto' if not provided.
     */
    @action
    init = async (savedPreference?: LocalePreference): Promise<void> => {
        this.isLoading = true;
        this.userLocalePreference = savedPreference || LANGUAGE_AUTO;

        try {
            const resolved = await this.service.loadLocaleData(savedPreference);

            runInAction(() => {
                this.currentLocale = resolved;
                this.isLoading = false;
            });
        } catch (e) {
            log.warn('[vpn.TranslationStore]: Failed to initialize, falling back to English', e);
            runInAction(() => {
                this.currentLocale = BASE_LOCALE;
                this.isLoading = false;
            });
        }
    };

    /**
     * Changes the locale preference.
     * Loads the new locale data via the service and sets own observables.
     *
     * @param preference 'auto' or a specific locale code (e.g. 'de').
     */
    @action
    setLocalePreference = async (preference: LocalePreference): Promise<void> => {
        this.isLoading = true;
        this.userLocalePreference = preference;

        try {
            const resolved = await this.service.loadLocaleData(preference);

            runInAction(() => {
                this.currentLocale = resolved;
                this.isLoading = false;
            });
        } catch (e) {
            log.warn('[vpn.TranslationStore]: Failed to set locale, falling back to English', e);
            runInAction(() => {
                this.currentLocale = BASE_LOCALE;
                this.isLoading = false;
            });
        }
    };

    /**
     * Returns the translated message for the given key.
     *
     * @param key Translation message key.
     *
     * @returns Translated message, or empty string if untranslated in current locale.
     *
     * @throws If the key does not exist in the English base messages.
     */
    getMessage = (key: string): string => {
        return this.service.getMessage(this.currentLocale, key);
    };

    /**
     * Returns the UI language code for `@adguard/translate`.
     *
     * @returns Lowercase locale code matching the `AvailableLocales` enum
     *          in `@adguard/translate` (e.g. 'de', 'pt_br', 'zh_cn').
     */
    getUILanguage = (): string => {
        return this.service.getUILanguage(this.currentLocale);
    };

    /**
     * Returns the English base message for the given key.
     * Returns an empty string if the key is not found.
     *
     * @param key Translation message key.
     *
     * @returns English base message, or empty string if not found.
     */
    getBaseMessage = (key: string): string => {
        return this.service.getBaseMessage(key);
    };

    /**
     * Returns the base locale code.
     *
     * @returns The base locale code ('en').
     */
    getBaseUILanguage = (): string => {
        return this.service.getBaseUILanguage();
    };
}
