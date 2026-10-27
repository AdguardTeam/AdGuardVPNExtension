import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { messenger } from '../../../src/common/messenger';
import { SETTINGS_IDS } from '../../../src/common/constants';
import { SettingsStore } from '../../../src/options/stores/SettingsStore';
import { type RootStore } from '../../../src/options/stores/RootStore';

vi.mock('../../../src/common/messenger', () => ({
    messenger: {
        openPremiumPromoPage: vi.fn(),
        openPremiumPromoPageFromSettings: vi.fn(),
        setSetting: vi.fn(),
    },
}));

/**
 * Root store stub: the tested methods do not use it.
 */
const rootStoreStub = {} as RootStore;

let settingsStore: SettingsStore;

beforeEach(() => {
    vi.clearAllMocks();
    settingsStore = new SettingsStore(rootStoreStub);
});

describe('SettingsStore purchase links', () => {
    it('should open the popup purchase link for the popup promo', async () => {
        await settingsStore.openPremiumPromoPage();

        expect(messenger.openPremiumPromoPage).toHaveBeenCalledTimes(1);
        expect(messenger.openPremiumPromoPageFromSettings).not.toHaveBeenCalled();
    });

    it('should open the settings purchase link for the settings promo', async () => {
        await settingsStore.openPremiumPromoPageFromSettings();

        expect(messenger.openPremiumPromoPageFromSettings).toHaveBeenCalledTimes(1);
        expect(messenger.openPremiumPromoPage).not.toHaveBeenCalled();
    });
});

describe('SettingsStore locations', () => {
    it('should replace the locations list with the refreshed data', () => {
        const locations = [{
            id: 'location-1',
            countryName: 'Germany',
            cityName: 'Berlin',
            countryCode: 'DE',
            pingBonus: 0,
            premiumOnly: false,
            virtual: false,
        }];

        settingsStore.setLocations(locations);

        expect(settingsStore.locations).toEqual(locations);
    });
});

describe('SettingsStore premium promo visibility', () => {
    it('should hide the premium promo and persist the setting', async () => {
        await settingsStore.hidePremiumFeatures();

        expect(messenger.setSetting).toHaveBeenCalledWith(SETTINGS_IDS.PREMIUM_FEATURES_SHOW, false);
        expect(settingsStore.premiumFeatures).toBe(false);
    });

    it('should apply the visibility received from another options tab without persisting it again', () => {
        settingsStore.setPremiumFeatures(false);

        expect(settingsStore.premiumFeatures).toBe(false);
        expect(messenger.setSetting).not.toHaveBeenCalled();
    });
});
