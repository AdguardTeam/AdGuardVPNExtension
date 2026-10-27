import {
    describe,
    it,
    expect,
    beforeEach,
    vi,
} from 'vitest';

// eslint-disable-next-line import/first
import { VpnStore, type LocationData } from '../../../src/popup/stores/VpnStore';
// eslint-disable-next-line import/first
import { type RootStore } from '../../../src/popup/stores/RootStore';

const { mockForceUpdateLocations } = vi.hoisted(() => ({
    mockForceUpdateLocations: vi.fn(),
}));

vi.mock('../../../src/common/messenger', () => ({
    messenger: {
        forceUpdateLocations: mockForceUpdateLocations,
    },
}));

/**
 * Creates a store with an empty root store: the switch notifications
 * do not depend on it.
 *
 * @returns Vpn store instance.
 */
const makeStore = (): VpnStore => new VpnStore({} as unknown as RootStore);

/**
 * Creates a store whose settings store reports pings as calculated,
 * which is required by the fastest locations getter.
 *
 * @returns Vpn store instance.
 */
const makeStoreWithSettings = (): VpnStore => new VpnStore({
    settingsStore: { arePingsRecalculating: false },
} as unknown as RootStore);

describe('VpnStore fastest locations', () => {
    let store: VpnStore;

    /**
     * Builds a location with the fields the popup uses.
     *
     * @param location Location fields.
     *
     * @returns Location data.
     */
    const makeLocation = ({
        id,
        ping,
        pingBonus = 0,
        premiumOnly = false,
    }: {
        id: string;
        ping: number;
        pingBonus?: number;
        premiumOnly?: boolean;
    }): LocationData => ({
        id,
        countryName: id,
        cityName: id,
        countryCode: id.toUpperCase(),
        ping,
        pingBonus,
        premiumOnly,
        virtual: false,
    });

    beforeEach(() => {
        store = makeStoreWithSettings();
        store.isPremiumToken = true;
    });

    it('should rank locations by ping minus the backend ping bonus', () => {
        store.setLocations([
            makeLocation({ id: 'pl', ping: 40 }),
            makeLocation({ id: 'nl', ping: 60, pingBonus: 30 }),
            makeLocation({ id: 'fr', ping: 50 }),
        ]);

        const fastestIds = store.fastestLocationsToDisplay.map((location) => location.id);

        expect(fastestIds).toEqual(['nl', 'pl', 'fr']);
    });

    it('should keep displaying the real ping of a bonus-promoted location', () => {
        store.setLocations([
            makeLocation({ id: 'pl', ping: 40 }),
            makeLocation({ id: 'nl', ping: 60, pingBonus: 30 }),
        ]);

        const fastest = store.fastestLocationsToDisplay;

        expect(fastest[0].id).toBe('nl');
        expect(fastest[0].ping).toBe(60);
    });

    it('should exclude premium-only locations for free users', () => {
        store.isPremiumToken = false;
        store.setLocations([
            makeLocation({
                id: 'nl',
                ping: 60,
                pingBonus: 30,
                premiumOnly: true,
            }),
            makeLocation({ id: 'pl', ping: 40 }),
            makeLocation({ id: 'fr', ping: 50 }),
        ]);

        const fastestIds = store.fastestLocationsToDisplay.map((location) => location.id);

        expect(fastestIds).toEqual(['pl', 'fr']);
    });
});

describe('VpnStore profile switch notifications', () => {
    let store: VpnStore;

    beforeEach(() => {
        store = makeStore();
    });

    it('should not show a toast on a successful switch', () => {
        store.handleProfileChanged({ profileId: 'work', success: true });

        expect(store.profileSwitchNotification).toBe(0);
    });

    it('should increment the error counter on a failed switch', () => {
        store.handleProfileChanged({ profileId: 'work', success: false });

        expect(store.profileSwitchNotification).toBe(1);
    });

    it('should show the failure when it follows a successful switch', () => {
        store.handleProfileChanged({ profileId: 'work', success: true });
        store.handleProfileChanged({ profileId: 'home', success: false });

        expect(store.profileSwitchNotification).toBe(1);
    });

    it('should keep the error toast visible after a successful switch', () => {
        store.handleProfileChanged({ profileId: 'work', success: false });
        store.handleProfileChanged({ profileId: 'home', success: true });

        expect(store.profileSwitchNotification).toBe(1);
    });

    it('should clear the error counter on dismissal', () => {
        store.handleProfileChanged({ profileId: 'work', success: false });

        store.clearProfileSwitchNotification();

        expect(store.profileSwitchNotification).toBe(0);
    });
});

describe('VpnStore forceUpdateLocations', () => {
    let store: VpnStore;

    beforeEach(() => {
        store = makeStore();
        mockForceUpdateLocations.mockReset();
    });

    it('should return the locations from the messenger', async () => {
        const locations = [{ id: 'de', cityName: 'Berlin' }];
        mockForceUpdateLocations.mockResolvedValue(locations);

        await expect(store.forceUpdateLocations()).resolves.toBe(locations);
    });

    it('should return an empty list when the messenger returns null', async () => {
        mockForceUpdateLocations.mockResolvedValue(null);

        await expect(store.forceUpdateLocations()).resolves.toEqual([]);
    });
});
