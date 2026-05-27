import throttle from 'lodash/throttle';

import { log } from '../../common/logger';
import {
    AppearanceTheme,
    QuickConnectSetting,
    SETTINGS_IDS,
    QUICK_CONNECT_SETTING_DEFAULT,
} from '../../common/constants';
import { browserApi } from '../browserApi';
import { servicesManager } from '../exclusions/services/ServicesManager';
import { complementedExclusionsWithServices, complementExclusions } from '../exclusions/exclusions-helpers';
import { ExclusionState, ExclusionsMode } from '../../common/exclusionsConstants';
import { type StorageInterface } from '../browserApi/storage';
import { type ExclusionInterface } from '../schema';
import { THEME_STORAGE_KEY } from '../../common/useAppearanceTheme';
import { DEFAULT_PROFILE_ID } from '../../common/profiles';
import { DEFAULT_DNS_SERVER } from '../../common/dnsConstants';
import { type ProfileSettings } from '../schema/profiles/profileSettings';
import { type ProfilesState } from '../schema/profiles/profilesState';

type VersionType = { [x: string]: any; VERSION: string; };

const SCHEME_VERSION = '15';
const THROTTLE_TIMEOUT = 100;

const OLD_DARK_THEME_NAME = 'DARK';
const OLD_LIGHT_THEME_NAME = 'LIGHT';

// TODO: add Settings type to schemas and remove any
export type Settings = {
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
    public storage: StorageInterface;

    public defaults: Settings;

    public settings: Settings;

    constructor(storage: StorageInterface, defaults: Settings) {
        this.storage = storage;
        this.defaults = defaults;
    }

    public SETTINGS_KEY = 'settings.service.key';

    public async init(): Promise<void> {
        let settings;
        try {
            settings = await this.storage.get<Settings>(this.SETTINGS_KEY);
        } catch (e) {
            log.error(`[vpn.SettingsService.init]: Was unable to get ${this.SETTINGS_KEY} from storage, due to: `, e.message);
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

    private migrateFrom1to2 = (oldSettings: Settings): VersionType => {
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

    private migrateFrom2to3 = (oldSettings: Settings): VersionType => {
        return {
            ...oldSettings,
            VERSION: '3',
            [SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]: this.defaults[SETTINGS_IDS.HANDLE_WEBRTC_ENABLED],
        };
    };

    private migrateFrom3to4 = (oldSettings: Settings): VersionType => {
        return {
            ...oldSettings,
            VERSION: '4',
            [SETTINGS_IDS.CONTEXT_MENU_ENABLED]: this.defaults[SETTINGS_IDS.CONTEXT_MENU_ENABLED],
            [SETTINGS_IDS.SELECTED_DNS_SERVER]: this.defaults[SETTINGS_IDS.SELECTED_DNS_SERVER],
        };
    };

    private migrateFrom4to5 = (oldSettings: Settings): VersionType => {
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

    private migrateFrom5to6 = async (oldSettings: Settings): Promise<VersionType> => {
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

    private migrateFrom6to7 = (oldSettings: Settings): VersionType => {
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
     *
     * @returns New settings.
     */
    private migrateFrom7to8 = (oldSettings: Settings): VersionType => {
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
     * Migration to new settings considering services.
     *
     * @param oldSettings
     *
     * @returns New settings.
     */
    private migrateFrom8to9 = async (oldSettings: Settings): Promise<VersionType> => {
        const updateExclusionsState = (oldExclusions: OldExclusion[]): {
            id: string;
            hostname: string;
            state: ExclusionState
        }[] => {
            return oldExclusions.map((exclusion) => {
                return {
                    id: exclusion.id,
                    hostname: exclusion.hostname,
                    state: exclusion.enabled ? ExclusionState.Enabled : ExclusionState.Disabled,
                };
            });
        };

        const services = await servicesManager.getServicesForMigration();

        const migrateExclusions = (exclusions: OldExclusion[]): ExclusionInterface[] => {
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

    private migrateFrom9to10 = async (oldSettings: Settings): Promise<VersionType> => {
        return {
            ...oldSettings,
            VERSION: '10',
            [SETTINGS_IDS.CUSTOM_DNS_SERVERS]: this.defaults[SETTINGS_IDS.CUSTOM_DNS_SERVERS],
        };
    };

    private migrateFrom10to11 = (oldSettings: Settings): Settings => {
        if (browserApi.runtime.getManifest().manifest_version === 2) {
            const appearanceTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (appearanceTheme) {
                browserApi.storage.set(THEME_STORAGE_KEY, appearanceTheme);
            }
        }
        return oldSettings;
    };

    /**
     * Runs settings migration from schema v11 to v12.
     *
     * For the extension update to v1.4.14.
     *
     * @param oldSettings Old settings.
     *
     * @returns Updated settings.
     */
    private migrateFrom11to12 = async (oldSettings: Settings): Promise<VersionType> => {
        // update SETTINGS_IDS.APPEARANCE_THEME setting value
        // after converting APPEARANCE_THEMES object to enum
        let currentTheme = oldSettings[SETTINGS_IDS.APPEARANCE_THEME];

        if (currentTheme === OLD_DARK_THEME_NAME) {
            currentTheme = AppearanceTheme.Dark;
        } else if (currentTheme === OLD_LIGHT_THEME_NAME) {
            currentTheme = AppearanceTheme.Light;
        } else {
            currentTheme = AppearanceTheme.System;
        }

        return {
            ...oldSettings,
            VERSION: '12',
            [SETTINGS_IDS.QUICK_CONNECT]: this.defaults[SETTINGS_IDS.QUICK_CONNECT],
            [SETTINGS_IDS.APPEARANCE_THEME]: currentTheme,
        };
    };

    /**
     * Runs settings migration from schema v12 to v13.
     *
     * Migrates AB test storage from old schema to new schema.
     * Old schema: versions were stored as array of strings.
     * New schema: versions are stored as array of objects with version and completed fields.
     * Since old AB tests are completed, we clear the old storage.
     *
     * @param oldSettings Old settings.
     *
     * @returns Updated settings.
     */
    public migrateFrom12to13 = async (oldSettings: Settings): Promise<VersionType> => {
        const AB_TEST_STORAGE_KEY = 'ab_test_manager.versions';

        try {
            const rawVersions = await browserApi.storage.get(AB_TEST_STORAGE_KEY);

            if (rawVersions && Array.isArray(rawVersions)) {
                const isOldFormat = rawVersions.some((item) => typeof item === 'string');

                if (isOldFormat) {
                    await browserApi.storage.remove(AB_TEST_STORAGE_KEY);
                }
            }
        } catch (e) {
            log.error('[vpn.SettingsService]: Failed to migrate AB test storage', e);
        }

        return {
            ...oldSettings,
            VERSION: '13',
        };
    };

    /**
     * Runs settings migration from schema v13 to v14.
     *
     * Removes the old AB test storage key completely as the extension now uses
     * a new slot-based A/B testing system with a different storage key.
     *
     * @param oldSettings Old settings.
     *
     * @returns Updated settings.
     */
    public migrateFrom13to14 = async (oldSettings: Settings): Promise<VersionType> => {
        const AB_TEST_STORAGE_KEY = 'ab_test_manager.versions';

        try {
            await browserApi.storage.remove(AB_TEST_STORAGE_KEY);
        } catch (e) {
            log.error('[vpn.SettingsService]: Failed to remove AB test storage key', e);
        }

        return {
            ...oldSettings,
            VERSION: '14',
        };
    };

    /**
     * Runs settings migration from schema v14 to v15.
     *
     * Moves deprecated per-user settings (exclusions, WebRTC, DNS, location,
     * quick-connect) into the Default profile and removes the old keys.
     *
     * @param oldSettings Old settings.
     * @returns Updated settings.
     */
    public migrateFrom14to15 = (oldSettings: Settings): VersionType => {
        const oldExclusions = oldSettings[SETTINGS_IDS.EXCLUSIONS];
        const rawRegular = oldExclusions?.[ExclusionsMode.Regular];
        const rawSelective = oldExclusions?.[ExclusionsMode.Selective];
        const isValidExclusion = (entry: unknown): boolean => {
            if (typeof entry !== 'object' || entry === null) {
                return false;
            }

            if (!('id' in entry) || !('hostname' in entry) || !('state' in entry)) {
                return false;
            }

            return typeof entry.id === 'string'
                && typeof entry.hostname === 'string'
                && entry.hostname.length > 0
                && (entry.state === ExclusionState.Enabled || entry.state === ExclusionState.Disabled);
        };

        const exclusions = {
            [ExclusionsMode.Regular]: Array.isArray(rawRegular)
                ? rawRegular.filter(isValidExclusion)
                : [],
            [ExclusionsMode.Selective]: Array.isArray(rawSelective)
                ? rawSelective.filter(isValidExclusion)
                : [],
            inverted: oldExclusions?.inverted === true,
        };

        const handleWebRtcEnabled = oldSettings[SETTINGS_IDS.HANDLE_WEBRTC_ENABLED] === true;
        const rawDnsServer = oldSettings[SETTINGS_IDS.SELECTED_DNS_SERVER];
        if (typeof rawDnsServer !== 'string') {
            log.warn('[vpn.SettingsService]: Invalid DNS server value, using default', rawDnsServer);
        }
        const selectedDnsServer = typeof rawDnsServer === 'string' ? rawDnsServer : DEFAULT_DNS_SERVER.id;
        const rawCustomDns = oldSettings[SETTINGS_IDS.CUSTOM_DNS_SERVERS];

        const isValidDnsEntry = (entry: unknown): boolean => {
            if (typeof entry !== 'object' || entry === null) {
                return false;
            }

            if (!('id' in entry) || !('title' in entry) || !('address' in entry)) {
                return false;
            }

            return typeof entry.id === 'string'
                && entry.id.length > 0
                && typeof entry.title === 'string'
                && typeof entry.address === 'string'
                && entry.address.length > 0;
        };

        const customDnsServers = Array.isArray(rawCustomDns)
            ? rawCustomDns.filter(isValidDnsEntry)
            : [];
        const rawQuickConnect = oldSettings[SETTINGS_IDS.QUICK_CONNECT];
        // NOTE: QuickConnectSetting must remain a regular enum (not const) for this runtime check.
        if (!Object.values(QuickConnectSetting).includes(rawQuickConnect)) {
            log.warn('[vpn.SettingsService]: Invalid quick connect value, using default', rawQuickConnect);
        }
        const quickConnect = Object.values(QuickConnectSetting).includes(rawQuickConnect)
            ? rawQuickConnect
            : QUICK_CONNECT_SETTING_DEFAULT;
        const rawLocation = oldSettings[SETTINGS_IDS.SELECTED_LOCATION_KEY];
        const isValidLocation = typeof rawLocation === 'object'
            && rawLocation !== null
            && typeof rawLocation.id === 'string'
            && rawLocation.id.length > 0;
        if (rawLocation != null && !isValidLocation) {
            log.warn('[vpn.SettingsService]: Invalid location value, resetting to null', rawLocation);
        }
        const selectedLocation = isValidLocation ? rawLocation : null;

        const profileSettings: ProfileSettings = {
            selectedLocation,
            quickConnect,
            handleWebRtcEnabled,
            selectedDnsServer,
            customDnsServers,
            exclusions,
        };

        const profilesState: ProfilesState = {
            activeProfileId: DEFAULT_PROFILE_ID,
            profiles: [
                {
                    id: DEFAULT_PROFILE_ID,
                    // Empty name — the UI resolves display name from the ID for the Default profile.
                    name: '',
                    settings: profileSettings,
                },
            ],
        };

        const newSettings = { ...oldSettings };
        delete newSettings[SETTINGS_IDS.EXCLUSIONS];
        delete newSettings[SETTINGS_IDS.HANDLE_WEBRTC_ENABLED];
        delete newSettings[SETTINGS_IDS.SELECTED_DNS_SERVER];
        delete newSettings[SETTINGS_IDS.CUSTOM_DNS_SERVERS];
        delete newSettings[SETTINGS_IDS.QUICK_CONNECT];
        delete newSettings[SETTINGS_IDS.SELECTED_LOCATION_KEY];
        delete newSettings[SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY];
        delete newSettings[SETTINGS_IDS.SELECTED_CUSTOM_DNS_SERVER];
        // Drop any stale PROFILES_STATE — we rebuild it from the legacy keys above.
        delete newSettings[SETTINGS_IDS.PROFILES_STATE];

        return {
            ...newSettings,
            VERSION: '15',
            [SETTINGS_IDS.PROFILES_STATE]: profilesState,
        };
    };

    /**
     * In order to add migration, create new function which modifies old settings into new
     * And add this migration under related old settings scheme version
     * For example if your migration function migrates your settings from scheme 4 to 5, then add
     * it under number 4
     */
    private migrationFunctions: MigrationFunctions = {
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
        11: this.migrateFrom11to12,
        12: this.migrateFrom12to13,
        13: this.migrateFrom13to14,
        14: this.migrateFrom14to15,
    };

    private async applyMigrations(oldVersion: number, newVersion: number, oldSettings: Settings): Promise<Settings> {
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
     * because we never have changed the scheme yet.
     *
     * @param oldSettings
     *
     * @returns New settings.
     */
    private async migrateSettings(oldSettings: Settings): Promise<Settings> {
        log.info(`[vpn.SettingsService.migrateSettings]: Settings were converted from ${oldSettings.VERSION} to ${SCHEME_VERSION}`);
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

    private checkSchemeMatch(settings: Settings): Settings | Promise<Settings> {
        const version = settings.VERSION;
        if (version === SCHEME_VERSION) {
            return settings;
        }
        log.debug(`[vpn.SettingsService.checkSchemeMatch]: Expected scheme version ${SCHEME_VERSION} and got ${version}`);
        return this.migrateSettings(settings);
    }

    public persist = throttle(async (settings = this.settings) => {
        await this.storage.set(this.SETTINGS_KEY, settings);
    }, THROTTLE_TIMEOUT, { leading: false });

    public setSetting(key: string, value: any): void {
        this.settings[key] = value;
        this.persist();
    }

    public getSetting(key: string): any {
        return this.settings && this.settings[key];
    }

    public getSettings(): Settings {
        return this.settings;
    }

    public async clearSettings(): Promise<void> {
        this.settings = {};
        await this.storage.remove(this.SETTINGS_KEY);
    }
}
