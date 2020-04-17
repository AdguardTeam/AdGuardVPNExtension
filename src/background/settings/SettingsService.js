import throttle from 'lodash/throttle';
import log from '../../lib/logger';
import { SETTINGS_IDS } from '../../lib/constants';

const SCHEME_VERSION = '5';
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

    migrateFrom1to2 = (oldSettings) => {
        const exclusions = oldSettings[SETTINGS_IDS.EXCLUSIONS];

        const newExclusions = {
            inverted: false,
            blacklist: exclusions,
            whitelist: {},
        };

        return {
            ...oldSettings,
            VERSION: '2',
            [SETTINGS_IDS.EXCLUSIONS]: newExclusions,
        };
    };

    migrateFrom2to3 = (oldSettings) => {
        return {
            ...oldSettings,
            VERSION: '3',
            [SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]: this.defaults[SETTINGS_IDS.HANDLE_WEBRTC_ENABLED],
        };
    };

    migrateFrom3to4 = (oldSettings) => {
        return {
            ...oldSettings,
            VERSION: '4',
            [SETTINGS_IDS.CONTEXT_MENU_ENABLED]: this.defaults[SETTINGS_IDS.CONTEXT_MENU_ENABLED],
            [SETTINGS_IDS.SELECTED_DNS_SERVER]: this.defaults[SETTINGS_IDS.SELECTED_DNS_SERVER],
        };
    };

    migrateFrom4to5 = (oldSettings) => {
        const exclusions = oldSettings[SETTINGS_IDS.EXCLUSIONS];

        const newExclusions = {
            inverted: exclusions?.inverted || false,
            regular: exclusions?.blacklist || {},
            selective: exclusions?.whitelist || {},
        };

        return {
            ...oldSettings,
            VERSION: '5',
            [SETTINGS_IDS.EXCLUSIONS]: newExclusions,
        };
    }

    migrationFunctions = [
        this.migrateFrom1to2,
        this.migrateFrom2to3,
        this.migrateFrom3to4,
        this.migrateFrom4to5,
    ];

    applyMigrations(newVersion, oldVersion, oldSettings) {
        const migrationsToApply = this.migrationFunctions.slice(oldVersion - 1, newVersion - 1);
        return migrationsToApply.reduce((acc, migration) => {
            return migration(acc);
        }, oldSettings);
    }

    /**
     * Currently this method doesn't contain logic of migration,
     * because we never have changed the scheme yet
     * @param oldSettings
     * @returns {{VERSION: *}}
     */
    migrateSettings(oldSettings) {
        log.info(`Settings were converted from ${oldSettings.VERSION} to ${SCHEME_VERSION}`);
        let newSettings;

        const newVersionInt = Number.parseInt(SCHEME_VERSION, 10);
        const oldVersionInt = Number.parseInt(oldSettings.VERSION, 10);
        if (newVersionInt > oldVersionInt) {
            newSettings = this.applyMigrations(newVersionInt, oldVersionInt, oldSettings);
        } else {
            newSettings = {
                VERSION: SCHEME_VERSION,
                ...this.defaults,
            };
        }

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
