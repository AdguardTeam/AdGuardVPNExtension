import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
} from 'vitest';

import { SettingsService } from '../../../src/background/settings/SettingsService';
import { sleep } from '../../../src/common/helpers';

const SCHEME_VERSION = '13';

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

const storage = (() => {
    const settingsStorage: { [key: string]: any } = {};
    return {
        set: vi.fn((key, data) => {
            settingsStorage[key] = data;
        }),
        get: vi.fn((key) => {
            return settingsStorage[key];
        }),
        remove: vi.fn((key) => {
            return delete settingsStorage[key];
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
            // @ts-ignore - partly implementation
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
            // @ts-ignore - partly implementation
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

            let storageValue = storage.get(settingsService.SETTINGS_KEY);
            expect(storageValue)
                .toBe(undefined);

            const throttleSaveTimeoutOfSettingsService = 100;
            await sleep(throttleSaveTimeoutOfSettingsService + 10);
            storageValue = storage.get(settingsService.SETTINGS_KEY);

            expect(storageValue[enabledKey])
                .toBe(true);
            expect(storageValue[showPromoKey])
                .toBe(true);
        });
    });

    describe('migrateFrom12to13', () => {
        const AB_TEST_STORAGE_KEY = 'ab_test_manager.versions';

        beforeEach(() => {
            // @ts-ignore - partly implementation
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
});
