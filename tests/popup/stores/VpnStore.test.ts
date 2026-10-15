import {
    describe,
    it,
    expect,
    beforeEach,
    vi,
} from 'vitest';

// eslint-disable-next-line import/first
import { VpnStore } from '../../../src/popup/stores/VpnStore';
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
