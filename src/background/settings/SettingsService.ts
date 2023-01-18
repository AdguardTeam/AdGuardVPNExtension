import throttle from 'lodash/throttle';

import { log } from '../../lib/logger';
import { SETTINGS_IDS } from '../../lib/constants';
import { browserApi } from '../browserApi';
import { servicesManager } from '../exclusions/services/ServicesManager';
import {
    complementedExclusionsWithServices,
    complementExclusions,
} from '../exclusions/exclusions-helpers';
import { ExclusionState } from '../../common/exclusionsConstants';
import { StorageInterface } from '../browserApi/storage';
import { ExclusionInterface } from '../exclusions/exclusions/exclusionsTypes';
import { THEME_STORAGE_KEY } from '../../common/useAppearanceTheme';

const SCHEME_VERSION = '11';
const THROTTLE_TIMEOUT = 100;

type Settings = {
    [key: string]: any;
};

type MigrationFunctions = {
    [key: number]: (oldSettings: Settings) => Settings;
};

type OldExclusion = {
    id: string;
    enabled: boolean;
    hostname: string;
};

export class SettingsService {
    storage: StorageInterface;

    defaults: Settings;

    settings: Settings;

    constructor(storage: StorageInterface, defaults: Settings) {
        this.storage = storage;
        this.defaults = defaults;
    }

    SETTINGS_KEY = 'settings.service.key';

    async init(): Promise<void> {
        let settings;
        try {
            settings = await this.storage.get<Settings>(this.SETTINGS_KEY);
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
        this.settings = await this.checkSchemeMatch(settings);
    }

    migrateFrom1to2 = (oldSettings: Settings) => {
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

    migrateFrom2to3 = (oldSettings: Settings) => {
        return {
            ...oldSettings,
            VERSION: '3',
            [SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]: this.defaults[SETTINGS_IDS.HANDLE_WEBRTC_ENABLED],
        };
    };

    migrateFrom3to4 = (oldSettings: Settings) => {
        return {
            ...oldSettings,
            VERSION: '4',
            [SETTINGS_IDS.CONTEXT_MENU_ENABLED]: this.defaults[SETTINGS_IDS.CONTEXT_MENU_ENABLED],
            [SETTINGS_IDS.SELECTED_DNS_SERVER]: this.defaults[SETTINGS_IDS.SELECTED_DNS_SERVER],
        };
    };

    migrateFrom4to5 = (oldSettings: Settings) => {
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
    };

    migrateFrom5to6 = async (oldSettings: Settings) => {
        let isSelectedByUser = false;
        // check if no location was saved earlier
        // this is necessary in order to skip already working extensions
        // because we can't be sure if locations were selected by users or automatically
        const selectedLocation = await browserApi.storage.get(SETTINGS_IDS.SELECTED_LOCATION_KEY);

        if (selectedLocation) {
            isSelectedByUser = true;
        }

        return {
            ...oldSettings,
            VERSION: '6',
            [SETTINGS_IDS.SELECTED_LOCATION_KEY]: selectedLocation,
            [SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY]: isSelectedByUser,
        };
    };

    migrateFrom6to7 = (oldSettings: Settings) => {
        return {
            ...oldSettings,
            VERSION: '7',
            // Old users already gave policy agreement, when logged in
            [SETTINGS_IDS.POLICY_AGREEMENT]: true,
            [SETTINGS_IDS.HELP_US_IMPROVE]: this.defaults[SETTINGS_IDS.HELP_US_IMPROVE],
        };
    };

    /**
     * Converts regular and selective exclusions from object, for example:
     * { 5idvOJ7fv23sY8aHbe: { enabled: true, hostname: 'example.org', id: '5idvOJ7fv23sY8aHbe' } }
     * to array of objects:
     * [{ enabled: true, hostname: 'example.org' id: '5idvOJ7fv23sY8aHbe' }]
     */
    migrateFrom7to8 = (oldSettings: Settings) => {
        return {
            ...oldSettings,
            VERSION: '8',
            [SETTINGS_IDS.APPEARANCE_THEME]: this.defaults[SETTINGS_IDS.APPEARANCE_THEME],
            [SETTINGS_IDS.EXCLUSIONS]: {
                regular: Object.values(oldSettings[SETTINGS_IDS.EXCLUSIONS].regular),
                selective: Object.values(oldSettings[SETTINGS_IDS.EXCLUSIONS].selective),
                inverted: oldSettings[SETTINGS_IDS.EXCLUSIONS].inverted,
            },
        };
    };

    /**
     * Migration to new settings considering services
     * @param oldSettings
     */
    migrateFrom8to9 = async (oldSettings: Settings) => {
        const updateExclusionsState = (oldExclusions: OldExclusion[]) => {
            return oldExclusions.map((exclusion) => {
                return {
                    id: exclusion.id,
                    hostname: exclusion.hostname,
                    state: exclusion.enabled ? ExclusionState.Enabled : ExclusionState.Disabled,
                };
            });
        };

        const services = await servicesManager.getServicesForMigration();

        const migrateExclusions = (exclusions: OldExclusion[]) => {
            const exclusionsWithUpdatedState = updateExclusionsState(exclusions);
            const complementedExclusions = complementExclusions(<ExclusionInterface[]>exclusionsWithUpdatedState);
            const exclusionsComplementedWithServices = complementedExclusionsWithServices(
                complementedExclusions,
                services,
            );

            return exclusionsComplementedWithServices;
        };

        const oldExclusions = oldSettings[SETTINGS_IDS.EXCLUSIONS];
        const newRegular = migrateExclusions(oldExclusions.regular);
        const newSelective = migrateExclusions(oldExclusions.selective);

        return {
            ...oldSettings,
            VERSION: '9',
            [SETTINGS_IDS.PREMIUM_FEATURES_SHOW]: this.defaults[SETTINGS_IDS.PREMIUM_FEATURES_SHOW],
            [SETTINGS_IDS.EXCLUSIONS]: {
                regular: newRegular,
                selective: newSelective,
                inverted: oldExclusions.inverted,
            },
        };
    };

    migrateFrom9to10 = async (oldSettings: Settings) => {
        return {
            ...oldSettings,
            VERSION: '10',
            [SETTINGS_IDS.CUSTOM_DNS_SERVERS]: this.defaults[SETTINGS_IDS.CUSTOM_DNS_SERVERS],
        };
    };

    migrateFrom10to11 = (oldSettings: Settings) => {
        if (browserApi.runtime.isManifestVersion2()) {
            const appearanceTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (appearanceTheme) {
                browserApi.storage.set(THEME_STORAGE_KEY, appearanceTheme);
            }
        }
        return oldSettings;
    };

    /**
     * In order to add migration, create new function which modifies old settings into new
     * And add this migration under related old settings scheme version
     * For example if your migration function migrates your settings from scheme 4 to 5, then add
     * it under number 4
     */
    migrationFunctions: MigrationFunctions = {
        1: this.migrateFrom1to2,
        2: this.migrateFrom2to3,
        3: this.migrateFrom3to4,
        4: this.migrateFrom4to5,
        5: this.migrateFrom5to6,
        6: this.migrateFrom6to7,
        7: this.migrateFrom7to8,
        8: this.migrateFrom8to9,
        9: this.migrateFrom9to10,
        10: this.migrateFrom10to11,
    };

    async applyMigrations(oldVersion: number, newVersion: number, oldSettings: Settings): Promise<Settings> {
        let newSettings = { ...oldSettings };
        for (let i = oldVersion; i < newVersion; i += 1) {
            const migrationFunction = this.migrationFunctions[i];
            if (!migrationFunction) {
                // eslint-disable-next-line no-continue
                continue;
            }
            // eslint-disable-next-line no-await-in-loop
            newSettings = await migrationFunction(newSettings);
        }
        return newSettings;
    }

    /**
     * Currently this method doesn't contain logic of migration,
     * because we never have changed the scheme yet
     * @param oldSettings
     */
    async migrateSettings(oldSettings: Settings): Promise<Settings> {
        log.info(`Settings were converted from ${oldSettings.VERSION} to ${SCHEME_VERSION}`);
        let newSettings;

        const newVersionInt = Number.parseInt(SCHEME_VERSION, 10);
        const oldVersionInt = Number.parseInt(oldSettings.VERSION, 10);
        if (newVersionInt > oldVersionInt) {
            newSettings = await this.applyMigrations(oldVersionInt, newVersionInt, oldSettings);
        } else {
            newSettings = {
                VERSION: SCHEME_VERSION,
                ...this.defaults,
            };
        }

        this.persist(newSettings);
        return newSettings;
    }

    checkSchemeMatch(settings: Settings): Settings | Promise<Settings> {
        const version = settings.VERSION;
        if (version === SCHEME_VERSION) {
            return settings;
        }
        log.debug(`Expected scheme version ${SCHEME_VERSION} and got ${version}`);
        return this.migrateSettings(settings);
    }

    persist = throttle(async (settings = this.settings) => {
        await this.storage.set(this.SETTINGS_KEY, settings);
    }, THROTTLE_TIMEOUT, { leading: false });

    setSetting(key: string, value: any): void {
        this.settings[key] = value;
        this.persist();
    }

    getSetting(key: string): any {
        return this.settings && this.settings[key];
    }

    getSettings(): Settings {
        return this.settings;
    }

    async clearSettings(): Promise<void> {
        this.settings = {};
        await this.storage.remove(this.SETTINGS_KEY);
    }
}
