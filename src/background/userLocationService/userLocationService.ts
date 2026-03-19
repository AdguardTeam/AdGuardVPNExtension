import { log } from '../../common/logger';
import { vpnProvider, type CurrentLocationData } from '../providers/vpnProvider';
import { i18n } from '../../common/i18n';
import { type AvailableLocale, RU_LOCALE } from '../../common/locale/localeConstants';

/**
 * Service for determining user's geographical location.
 * Uses backend API to get country code and caches the result in memory.
 * Falls back to browser language if backend request fails.
 */
class UserLocationService {
    /**
     * Mapping of country codes from CurrentLocationData to browser locales for affected regions.
     */
    private readonly countryCodeToLocale: Record<CurrentLocationData['countryCode'], AvailableLocale> = {
        RU: RU_LOCALE,
    };

    /**
     * Cached country code from backend.
     */
    private countryCode: string | null = null;

    /**
     * Initializes the service by fetching user location from backend.
     * Should be called during app initialization.
     */
    public async init(): Promise<void> {
        try {
            await this.fetchLocation();
        } catch (e) {
            log.error('[vpn.UserLocationService.init]: Failed to initialize:', e);
        }
    }

    /**
     * Fetches user location from backend and caches it in memory.
     */
    private async fetchLocation(): Promise<void> {
        try {
            const currentLocation = await vpnProvider.getCurrentLocation();
            this.countryCode = currentLocation.countryCode;
            log.info('[vpn.UserLocationService.fetchLocation]: Fetched location from backend:', this.countryCode);
        } catch (e) {
            log.warn('[vpn.UserLocationService.fetchLocation]: Failed to fetch location from backend, will use browser language:', e);
        }
    }

    /**
     * Determines if user is located in a region that requires special notice.
     * Uses backend country code if available, otherwise falls back to browser language.
     *
     * @returns True if user is in an affected region, false otherwise.
     */
    public isUserInAffectedRegion(): boolean {
        if (this.countryCode !== null) {
            return this.countryCode in this.countryCodeToLocale;
        }

        const browserLanguage = i18n.getUILanguage().toLowerCase();
        const affectedLocales = Object.values(this.countryCodeToLocale);

        return affectedLocales.some((locale) => browserLanguage.startsWith(locale));
    }
}

export const userLocationService = new UserLocationService();
