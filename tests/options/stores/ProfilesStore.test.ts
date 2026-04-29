import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { DEFAULT_PROFILE_ID } from '../../../src/common/profilesConstants';
import { messenger } from '../../../src/common/messenger';
import { ProfilesStore, type ProfilesOptionsData } from '../../../src/options/stores/ProfilesStore';

vi.mock('../../../src/common/messenger', () => ({
    messenger: {
        getProfilesData: vi.fn(),
        getProfilesOptionsData: vi.fn(),
    },
}));

vi.mock('../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn((key: string) => key),
    },
}));

const MOCK_PROFILES_DATA: ProfilesOptionsData = {
    profiles: [
        { id: DEFAULT_PROFILE_ID, name: '' },
        { id: 'work', name: 'Work' },
        { id: 'gaming', name: 'Gaming' },
    ],
    activeProfileId: 'work',
    profileWebRtcData: {
        [DEFAULT_PROFILE_ID]: false,
        work: true,
        gaming: false,
    },
};

describe('ProfilesStore', () => {
    let store: ProfilesStore;

    beforeEach(() => {
        vi.clearAllMocks();
        store = new ProfilesStore();
    });

    describe('setProfilesData', () => {
        it('should populate profiles and active profile ID', () => {
            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.profiles).toHaveLength(3);
            expect(store.activeProfileId).toBe('work');
        });

        it('should fill WebRTC cache from data map', () => {
            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.webRtcCache.get(DEFAULT_PROFILE_ID)).toBe(false);
            expect(store.webRtcCache.get('work')).toBe(true);
            expect(store.webRtcCache.get('gaming')).toBe(false);
        });

        it('should clear old WebRTC cache entries on reload', () => {
            store.updateWebRtcCache('old-profile', true);
            expect(store.webRtcCache.get('old-profile')).toBe(true);

            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.webRtcCache.has('old-profile')).toBe(false);
        });
    });

    describe('loadProfilesData', () => {
        it('should fetch data via messenger and apply to store', async () => {
            vi.mocked(messenger.getProfilesOptionsData).mockResolvedValue(MOCK_PROFILES_DATA);

            await store.loadProfilesData();

            expect(messenger.getProfilesOptionsData).toHaveBeenCalledOnce();
            expect(store.profiles).toHaveLength(3);
            expect(store.activeProfileId).toBe('work');
            expect(store.webRtcCache.get('work')).toBe(true);
        });

        it('should not throw when messenger rejects', async () => {
            vi.mocked(messenger.getProfilesOptionsData).mockRejectedValue(
                new Error('Network error'),
            );

            await expect(store.loadProfilesData()).resolves.not.toThrow();
        });
    });

    describe('updateWebRtcCache', () => {
        it('should set a new entry in the cache', () => {
            store.updateWebRtcCache('profile-1', true);

            expect(store.webRtcCache.get('profile-1')).toBe(true);
        });

        it('should overwrite an existing entry', () => {
            store.updateWebRtcCache('profile-1', true);
            store.updateWebRtcCache('profile-1', false);

            expect(store.webRtcCache.get('profile-1')).toBe(false);
        });
    });

    describe('isActive', () => {
        it('should return true for the active profile ID', () => {
            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.isActive('work')).toBe(true);
        });

        it('should return false for a non-active profile ID', () => {
            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.isActive('gaming')).toBe(false);
        });
    });

    describe('getDisplayName', () => {
        it('should return a translated name for the default profile', () => {
            const result = store.getDisplayName({ id: DEFAULT_PROFILE_ID, name: '' });

            expect(result).toBe('settings_profiles_default_name');
        });

        it('should return the stored name for custom profiles', () => {
            const result = store.getDisplayName({ id: 'work', name: 'Work' });

            expect(result).toBe('Work');
        });
    });
});
