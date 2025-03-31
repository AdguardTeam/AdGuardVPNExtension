import { SettingsService } from '../../../src/background/settings/SettingsService';
import { sleep } from '../../../src/common/helpers';

const SCHEME_VERSION = '12';

jest.mock('../../../src/background/auth/auth.ts', () => ({ auth: undefined }));

jest.mock('../../../src/background/config', () => ({ FORWARDER_URL_QUERIES: {} }));

jest.mock('../../../src/common/logger');

jest.mock('../../../src/background/browserApi', () => {
    return {
        browserApi: {
            runtime: {
                // TODO: test mv3 after official switch to mv3
                isManifestVersion2: () => true,
            },
        },
    };
});

jest.mock('../../../src/background/settings');

const storage = (() => {
    const settingsStorage: { [key: string]: any } = {};
    return {
        set: jest.fn((key, data) => {
            settingsStorage[key] = data;
        }),
        get: jest.fn((key) => {
            return settingsStorage[key];
        }),
        remove: jest.fn((key) => {
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
});
