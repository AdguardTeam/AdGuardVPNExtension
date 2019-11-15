import throttle from 'lodash/throttle';
import log from '../../lib/logger';

const SCHEME_VERSION = '1';
const THROTTLE_TIMEOUT = 100;

class SettingsService {
    constructor(storage, defaults) {
        this.storage = storage;
        this.defaults = defaults;
    }

    SETTINGS_KEY = 'settings.service.key';

    async init() {
        let settings;
        try {
            settings = await this.storage.get(this.SETTINGS_KEY);
        } catch (e) {
            log.error(`Was unable to get ${this.SETTINGS_KEY} from storage, due to: `, e.message);
        }
        if (!settings) {
            this.settings = {
                VERSION: SCHEME_VERSION,
                ...this.defaults,
            };
            this.persist();
            return;
        }
        this.settings = this.checkSchemeMatch(settings);
    }

    /**
     * Currently this method doesn't contain logic of migration,
     * because we never have changed the scheme yet
     * @param oldSettings
     * @returns {{VERSION: *}}
     */
    migrateSettings(oldSettings) {
        log.info(`Settings were converted from ${oldSettings.VERSION} to ${SCHEME_VERSION}`);
        const newSettings = {
            VERSION: SCHEME_VERSION,
            ...this.defaults,
        };
        this.persist(newSettings);
        return newSettings;
    }

    checkSchemeMatch(settings) {
        const version = settings.VERSION;
        if (version === SCHEME_VERSION) {
            return settings;
        }
        log.warn(`Expected scheme version ${SCHEME_VERSION} and got ${version}`);
        return this.migrateSettings(settings);
    }

    persist = throttle(async (settings = this.settings) => {
        await this.storage.set(this.SETTINGS_KEY, settings);
    }, THROTTLE_TIMEOUT, { leading: false });

    setSetting(key, value) {
        this.settings[key] = value;
        this.persist();
    }

    getSetting(key) {
        return this.settings && this.settings[key];
    }

    getSettings() {
        return this.settings;
    }

    async clearSettings() {
        this.settings = {};
        await this.storage.remove(this.SETTINGS_KEY);
    }
}

export default SettingsService;
