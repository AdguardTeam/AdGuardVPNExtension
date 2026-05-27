import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
} from 'vitest';

import { SettingsService } from '../../../src/background/settings/SettingsService';
import { type StorageInterface } from '../../../src/background/browserApi/storage';
import { SETTINGS_IDS } from '../../../src/common/constants';
import { sleep } from '../../../src/common/helpers';

const SCHEME_VERSION = '15';

vi.mock('../../../src/background/exclusions/services/ServicesManager', () => ({
    servicesManager: {
        getServicesForMigration: vi.fn().mockResolvedValue([]),
    },
}));

const abTestStorage: { [key: string]: any } = {};

vi.mock('../../../src/background/browserApi', () => ({
    browserApi: {
        storage: {
            get: vi.fn((key: string) => abTestStorage[key]),
            set: vi.fn((key: string, value: any) => {
                abTestStorage[key] = value;
            }),
            remove: vi.fn((key: string) => {
                delete abTestStorage[key];
            }),
        },
    },
}));

const storage: StorageInterface = (() => {
    const settingsStorage: { [key: string]: any } = {};
    return {
        set: vi.fn(async (key: string, data: unknown) => {
            settingsStorage[key] = data;
        }),
        get: vi.fn(async (key: string) => {
            return settingsStorage[key];
        }),
        remove: vi.fn(async (key: string) => {
            delete settingsStorage[key];
        }),
    };
})();

const defaults = {
    enabled: false,
    showPromo: false,
};

let settingsService: SettingsService;

describe('SettingsService', () => {
    describe('init', () => {
        const expectedSettings = {
            VERSION: SCHEME_VERSION,
            enabled: true,
            showPromo: true,
        };

        beforeEach(() => {
            settingsService = new SettingsService(storage, defaults);
        });

        afterEach(async () => {
            await settingsService.clearSettings();
        });

        it('inits correctly if storage is empty', async () => {
            await settingsService.init();
            const settings = settingsService.getSettings();
            expect(settings.VERSION)
                .toBe(expectedSettings.VERSION);
        });

        it('inits correctly with values from storage', async () => {
            storage.set(settingsService.SETTINGS_KEY, expectedSettings);
            await settingsService.init();
            const settings = settingsService.getSettings();
            expect(settings.VERSION)
                .toBe(expectedSettings.VERSION);
            expect(settings.enabled)
                .toBe(expectedSettings.enabled);
            expect(settings.showPromo)
                .toBe(expectedSettings.showPromo);
        });

        it('inits correctly if versions do not match', async () => {
            const unmatchedVersion = parseInt(SCHEME_VERSION, 10) + 1;
            storage.set(settingsService.SETTINGS_KEY, {
                ...expectedSettings,
                VERSION: unmatchedVersion,
            });
            await settingsService.init();
            const settings = settingsService.getSettings();
            expect(settings.VERSION)
                .toBe(SCHEME_VERSION);
            expect(settings.enabled)
                .toBe(defaults.enabled);
            expect(settings.showPromo)
                .toBe(defaults.showPromo);
        });
    });

    describe('updates values', () => {
        beforeEach(() => {
            settingsService = new SettingsService(storage, defaults);
            settingsService.init();
        });

        afterEach(async () => {
            await settingsService.clearSettings();
        });

        it('saves settings to the storage throttled', async () => {
            const enabledKey = 'enabled';
            const showPromoKey = 'showPromo';

            let settings = settingsService.getSettings();
            expect(settings[enabledKey])
                .toBeFalsy();

            settingsService.setSetting(enabledKey, true);
            settingsService.setSetting(showPromoKey, true);

            settings = settingsService.getSettings();
            expect(settings[enabledKey])
                .toBeTruthy();
            expect(settings[showPromoKey])
                .toBeTruthy();

            let storageValue = await storage.get<Record<string, boolean>>(settingsService.SETTINGS_KEY);
            expect(storageValue)
                .toBe(undefined);

            const throttleSaveTimeoutOfSettingsService = 100;
            await sleep(throttleSaveTimeoutOfSettingsService + 10);
            storageValue = await storage.get<Record<string, boolean>>(settingsService.SETTINGS_KEY);

            expect(storageValue![enabledKey])
                .toBe(true);
            expect(storageValue![showPromoKey])
                .toBe(true);
        });
    });

    describe('migrateFrom12to13', () => {
        const AB_TEST_STORAGE_KEY = 'ab_test_manager.versions';

        beforeEach(() => {
            settingsService = new SettingsService(storage, defaults);
            delete abTestStorage[AB_TEST_STORAGE_KEY];
        });

        afterEach(async () => {
            await settingsService.clearSettings();
            delete abTestStorage[AB_TEST_STORAGE_KEY];
        });

        it('clears old AB test storage format (array of strings)', async () => {
            const oldSettings = {
                VERSION: '12',
                enabled: true,
            };

            const oldAbTestData = ['reg_AG21492_def', 'v1', 'v2'];
            abTestStorage[AB_TEST_STORAGE_KEY] = oldAbTestData;

            const newSettings = await settingsService.migrateFrom12to13(oldSettings);

            expect(newSettings.VERSION).toBe('13');
            expect(abTestStorage[AB_TEST_STORAGE_KEY]).toBeUndefined();
        });

        it('does not clear new AB test storage format (array of objects)', async () => {
            const oldSettings = {
                VERSION: '12',
                enabled: true,
            };

            const newAbTestData = [
                { version: 'AG-47804-streaming-test-a_def', completed: false },
                { version: 'AG-47804-streaming-test-b', completed: true },
            ];
            abTestStorage[AB_TEST_STORAGE_KEY] = newAbTestData;

            const newSettings = await settingsService.migrateFrom12to13(oldSettings);

            expect(newSettings.VERSION).toBe('13');
            expect(abTestStorage[AB_TEST_STORAGE_KEY]).toEqual(newAbTestData);
        });
    });

    describe('migrateFrom13to14', () => {
        const AB_TEST_STORAGE_KEY = 'ab_test_manager.versions';

        beforeEach(() => {
            settingsService = new SettingsService(storage, defaults);
            delete abTestStorage[AB_TEST_STORAGE_KEY];
        });

        afterEach(async () => {
            await settingsService.clearSettings();
            delete abTestStorage[AB_TEST_STORAGE_KEY];
        });

        it('removes the old AB test storage key completely', async () => {
            const oldSettings = {
                VERSION: '13',
                enabled: true,
            };

            const abTestData = [
                { version: 'AG-47804-streaming-test-a_def', completed: false },
                { version: 'AG-47804-streaming-test-b', completed: true },
            ];
            abTestStorage[AB_TEST_STORAGE_KEY] = abTestData;

            const newSettings = await settingsService.migrateFrom13to14(oldSettings);

            expect(newSettings.VERSION).toBe('14');
            expect(abTestStorage[AB_TEST_STORAGE_KEY]).toBeUndefined();
        });

        it('handles migration when AB test storage key does not exist', async () => {
            const oldSettings = {
                VERSION: '13',
                enabled: true,
            };

            const newSettings = await settingsService.migrateFrom13to14(oldSettings);

            expect(newSettings.VERSION).toBe('14');
            expect(abTestStorage[AB_TEST_STORAGE_KEY]).toBeUndefined();
        });
    });

    describe('migrateFrom14to15', () => {
        beforeEach(() => {
            settingsService = new SettingsService(storage, defaults);
        });

        afterEach(async () => {
            await settingsService.clearSettings();
        });

        it('migrates legacy settings into Default profile', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.PROXY_ENABLED]: true,
                [SETTINGS_IDS.EXCLUSIONS]: {
                    regular: [{
                        id: '1', hostname: 'example.com', state: 'Enabled', children: [],
                    }],
                    selective: [],
                    inverted: false,
                },
                [SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]: true,
                [SETTINGS_IDS.SELECTED_DNS_SERVER]: 'adguard-dns',
                [SETTINGS_IDS.CUSTOM_DNS_SERVERS]: [{ id: 'c1', title: 'My DNS', address: '1.1.1.1' }],
                [SETTINGS_IDS.QUICK_CONNECT]: 'fastestLocation',
                [SETTINGS_IDS.SELECTED_LOCATION_KEY]: { id: 'us-east', city: 'New York' },
                [SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY]: true,
                [SETTINGS_IDS.SELECTED_CUSTOM_DNS_SERVER]: 'old-custom',
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            expect(newSettings.VERSION).toBe('15');
            // Legacy keys removed
            expect(newSettings[SETTINGS_IDS.EXCLUSIONS]).toBeUndefined();
            expect(newSettings[SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]).toBeUndefined();
            expect(newSettings[SETTINGS_IDS.SELECTED_DNS_SERVER]).toBeUndefined();
            expect(newSettings[SETTINGS_IDS.CUSTOM_DNS_SERVERS]).toBeUndefined();
            expect(newSettings[SETTINGS_IDS.QUICK_CONNECT]).toBeUndefined();
            expect(newSettings[SETTINGS_IDS.SELECTED_LOCATION_KEY]).toBeUndefined();
            expect(newSettings[SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY]).toBeUndefined();
            expect(newSettings[SETTINGS_IDS.SELECTED_CUSTOM_DNS_SERVER]).toBeUndefined();
            // Non-profile settings preserved
            expect(newSettings[SETTINGS_IDS.PROXY_ENABLED]).toBe(true);
            // Profile created with migrated values
            const profilesState = newSettings[SETTINGS_IDS.PROFILES_STATE];
            expect(profilesState.activeProfileId).toBe('default');
            expect(profilesState.profiles).toHaveLength(1);
            const profile = profilesState.profiles[0];
            expect(profile.id).toBe('default');
            expect(profile.settings.handleWebRtcEnabled).toBe(true);
            expect(profile.settings.selectedDnsServer).toBe('adguard-dns');
            expect(profile.settings.customDnsServers).toEqual([{ id: 'c1', title: 'My DNS', address: '1.1.1.1' }]);
            expect(profile.settings.quickConnect).toBe('fastestLocation');
            expect(profile.settings.selectedLocation).toEqual({ id: 'us-east', city: 'New York' });
            expect(profile.settings.exclusions.regular).toEqual([{
                id: '1', hostname: 'example.com', state: 'Enabled', children: [],
            }]);
            expect(profile.settings.exclusions.selective).toEqual([]);
            expect(profile.settings.exclusions.inverted).toBe(false);
        });

        it('uses defaults when legacy keys are missing', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.PROXY_ENABLED]: false,
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            expect(newSettings.VERSION).toBe('15');
            const profilesState = newSettings[SETTINGS_IDS.PROFILES_STATE];
            const profile = profilesState.profiles[0];
            expect(profile.settings.handleWebRtcEnabled).toBe(false);
            expect(profile.settings.selectedDnsServer).toBe('default');
            expect(profile.settings.customDnsServers).toEqual([]);
            expect(profile.settings.quickConnect).toBe('lastUsedLocation');
            expect(profile.settings.selectedLocation).toBeNull();
            expect(profile.settings.exclusions.regular).toEqual([]);
            expect(profile.settings.exclusions.selective).toEqual([]);
            expect(profile.settings.exclusions.inverted).toBe(false);
        });

        it('handles corrupted exclusions (non-array regular/selective)', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.EXCLUSIONS]: {
                    regular: 'corrupted-string',
                    selective: 12345,
                    inverted: 'not-a-boolean',
                },
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const { exclusions } = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0].settings;
            expect(exclusions.regular).toEqual([]);
            expect(exclusions.selective).toEqual([]);
            expect(exclusions.inverted).toBe(false);
        });

        it('preserves exclusions.inverted when true', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.EXCLUSIONS]: {
                    regular: [],
                    selective: [{
                        id: '1', hostname: 'example.com', state: 'Enabled',
                    }],
                    inverted: true,
                },
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const { exclusions } = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0].settings;
            expect(exclusions.inverted).toBe(true);
            expect(exclusions.selective).toEqual([{
                id: '1', hostname: 'example.com', state: 'Enabled',
            }]);
        });

        it('handles corrupted exclusions (primitive value)', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.EXCLUSIONS]: 'totally-broken',
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const { exclusions } = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0].settings;
            expect(exclusions.regular).toEqual([]);
            expect(exclusions.selective).toEqual([]);
            expect(exclusions.inverted).toBe(false);
        });

        it('handles corrupted custom DNS servers (non-array)', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.CUSTOM_DNS_SERVERS]: 'not-an-array',
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profile = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0];
            expect(profile.settings.customDnsServers).toEqual([]);
        });

        it('handles invalid quick connect value', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.QUICK_CONNECT]: 'invalidValue',
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profile = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0];
            expect(profile.settings.quickConnect).toBe('lastUsedLocation');
        });

        it('handles corrupted DNS server (non-string)', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.SELECTED_DNS_SERVER]: 42,
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profile = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0];
            expect(profile.settings.selectedDnsServer).toBe('default');
        });

        it('handles corrupted WebRTC (non-boolean truthy value)', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]: 'yes',
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profile = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0];
            expect(profile.settings.handleWebRtcEnabled).toBe(false);
        });

        it('overwrites anomalous profiles.state from v14 storage', () => {
            // profiles.state should not exist in v14 schema — if it does,
            // the migration must rebuild it from legacy keys.
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.PROFILES_STATE]: {
                    activeProfileId: 'stale',
                    profiles: [{ id: 'stale', name: 'Old', settings: {} }],
                },
                [SETTINGS_IDS.HANDLE_WEBRTC_ENABLED]: true,
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profilesState = newSettings[SETTINGS_IDS.PROFILES_STATE];
            expect(profilesState.activeProfileId).toBe('default');
            expect(profilesState.profiles).toHaveLength(1);
            expect(profilesState.profiles[0].id).toBe('default');
            expect(profilesState.profiles[0].settings.handleWebRtcEnabled).toBe(true);
        });

        it('falls back to null for corrupted selectedLocation', () => {
            const brokenLocation = { broken: true };
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.SELECTED_LOCATION_KEY]: brokenLocation,
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profile = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0];
            expect(profile.settings.selectedLocation).toBeNull();
        });

        it('falls back to null for non-object selectedLocation', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.SELECTED_LOCATION_KEY]: 'just-a-string',
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profile = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0];
            expect(profile.settings.selectedLocation).toBeNull();
        });

        it('preserves valid selectedLocation', () => {
            const validLocation = { id: 'us-east', cityName: 'New York', countryCode: 'US' };
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.SELECTED_LOCATION_KEY]: validLocation,
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profile = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0];
            expect(profile.settings.selectedLocation).toEqual(validLocation);
        });

        it('filters out corrupted entries in customDnsServers', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.CUSTOM_DNS_SERVERS]: [
                    { id: 'valid', title: 'My DNS', address: '1.1.1.1' },
                    { id: 'no-address', title: 'Broken' },
                    'just-a-string',
                    null,
                    { id: 'also-valid', title: 'Other', address: '8.8.8.8' },
                ],
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profile = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0];
            expect(profile.settings.customDnsServers).toEqual([
                { id: 'valid', title: 'My DNS', address: '1.1.1.1' },
                { id: 'also-valid', title: 'Other', address: '8.8.8.8' },
            ]);
        });

        it('filters out DNS entries with empty id or address', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.CUSTOM_DNS_SERVERS]: [
                    { id: '', title: 'Empty ID', address: '1.1.1.1' },
                    { id: 'valid', title: 'Good', address: '8.8.8.8' },
                    { id: 'empty-addr', title: 'Empty Addr', address: '' },
                ],
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const profile = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0];
            expect(profile.settings.customDnsServers).toEqual([
                { id: 'valid', title: 'Good', address: '8.8.8.8' },
            ]);
        });

        it('filters out invalid exclusion entries', () => {
            const oldSettings = {
                VERSION: '14',
                [SETTINGS_IDS.EXCLUSIONS]: {
                    regular: [
                        { id: '1', hostname: 'example.com', state: 'Enabled' },
                        { id: '2', hostname: '', state: 'Enabled' },
                        { id: '3', hostname: 'test.com', state: 'Unknown' },
                        { id: '4', hostname: 'missing-state.com' },
                        null,
                        'string-entry',
                        { id: '5', hostname: 'good.com', state: 'Disabled' },
                    ],
                    selective: [],
                },
            };

            const newSettings = settingsService.migrateFrom14to15(oldSettings);

            const { exclusions } = newSettings[SETTINGS_IDS.PROFILES_STATE].profiles[0].settings;
            expect(exclusions.regular).toEqual([
                { id: '1', hostname: 'example.com', state: 'Enabled' },
                { id: '5', hostname: 'good.com', state: 'Disabled' },
            ]);
        });
    });
});
