import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
} from 'vitest';

import { ExclusionsMode, ExclusionState, ExclusionsType } from '../../../src/common/exclusionsConstants';
import { DEFAULT_PROFILE_ID, type ProfilesOptionsData } from '../../../src/common/profiles';
import { DEFAULT_PROFILE_SETTINGS } from '../../../src/background/schema';
import { type ProfilesState } from '../../../src/background/schema';
import { ProfilesStore } from '../../../src/options/stores/ProfilesStore';
import { type RootStore } from '../../../src/options/stores/RootStore';

const TRANSLATED_DEFAULT_NAME = 'Default';

const { mockGetMessage } = vi.hoisted(() => ({
    mockGetMessage: vi.fn(() => TRANSLATED_DEFAULT_NAME),
}));

const mockMessenger = vi.hoisted(() => ({
    getProfilesData: vi.fn(),
    switchProfile: vi.fn().mockResolvedValue(undefined),
    setProfileQuickConnect: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../src/common/messenger', () => ({
    messenger: mockMessenger,
}));

vi.mock('../../../src/common/translator', () => ({
    translator: {
        getMessage: mockGetMessage,
    },
}));

const DEFAULT_PROFILE = { id: DEFAULT_PROFILE_ID, name: '' };
const CUSTOM_PROFILE = { id: 'custom-1', name: 'Work' };
const ANOTHER_PROFILE = { id: 'custom-2', name: 'Travel' };

const createProfileSettings = (overrides?: Partial<typeof DEFAULT_PROFILE_SETTINGS>) => ({
    ...DEFAULT_PROFILE_SETTINGS,
    ...overrides,
});

const PROFILES_STATE: ProfilesState = {
    activeProfileId: CUSTOM_PROFILE.id,
    profiles: [
        {
            ...DEFAULT_PROFILE,
            settings: createProfileSettings({ handleWebRtcEnabled: false }),
        },
        {
            ...CUSTOM_PROFILE,
            settings: createProfileSettings({ handleWebRtcEnabled: true }),
        },
        {
            ...ANOTHER_PROFILE,
            settings: createProfileSettings({ handleWebRtcEnabled: false }),
        },
    ],
};

const MOCK_PROFILES_DATA: ProfilesOptionsData = {
    profilesState: PROFILES_STATE,
    profileExclusionsData: {},
    switchingProfileId: null,
};

describe('ProfilesStore', () => {
    let store: ProfilesStore;
    let mockNotificationsStore: { notifySuccess: ReturnType<typeof vi.fn>; notifyError: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        vi.clearAllMocks();
        mockNotificationsStore = {
            notifySuccess: vi.fn(),
            notifyError: vi.fn(),
        };
        const mockRootStore = {
            notificationsStore: mockNotificationsStore,
        } as unknown as RootStore;
        store = new ProfilesStore(mockRootStore);
    });

    describe('initial state', () => {
        it('should have empty profiles list', () => {
            expect(store.profiles).toEqual([]);
        });

        it('should have default profile as active', () => {
            expect(store.activeProfileId).toBe(DEFAULT_PROFILE_ID);
        });
    });

    describe('setProfilesData', () => {
        it('should populate profiles and active profile ID', () => {
            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.profiles).toHaveLength(3);
            expect(store.activeProfileId).toBe(CUSTOM_PROFILE.id);
        });

        it('should fill WebRTC cache from data map', () => {
            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.webRtcCache[DEFAULT_PROFILE.id]).toBe(false);
            expect(store.webRtcCache[CUSTOM_PROFILE.id]).toBe(true);
            expect(store.webRtcCache[ANOTHER_PROFILE.id]).toBe(false);
        });

        it('should clear old WebRTC cache entries on reload', () => {
            store.updateWebRtcCache('old-profile', true);
            expect(store.webRtcCache['old-profile']).toBe(true);

            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.webRtcCache['old-profile']).toBeUndefined();
        });
    });

    describe('activeProfile', () => {
        it('should return undefined when profiles are empty', () => {
            expect(store.activeProfile).toBeUndefined();
        });

        it('should return the active profile', () => {
            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.activeProfile).toEqual(CUSTOM_PROFILE);
        });

        it('should return undefined if activeProfileId does not match any profile', () => {
            store.setProfilesData({
                ...MOCK_PROFILES_DATA,
                profilesState: { ...PROFILES_STATE, activeProfileId: 'nonexistent' },
            });

            expect(store.activeProfile).toBeUndefined();
        });
    });

    describe('getDisplayName', () => {
        it('should return translated name for default profile', () => {
            const name = store.getDisplayName(DEFAULT_PROFILE);

            expect(mockGetMessage).toHaveBeenCalledWith('settings_profiles_default_name');
            expect(name).toBe(TRANSLATED_DEFAULT_NAME);
        });

        it('should return profile name for custom profiles', () => {
            const name = store.getDisplayName(CUSTOM_PROFILE);
            expect(name).toBe('Work');
        });
    });

    describe('activeProfileDisplayName', () => {
        it('should return undefined when no active profile exists', () => {
            expect(store.activeProfileDisplayName).toBeUndefined();
        });

        it('should return translated name for default active profile', () => {
            store.setProfilesData({
                ...MOCK_PROFILES_DATA,
                profilesState: { ...PROFILES_STATE, activeProfileId: DEFAULT_PROFILE.id },
            });

            expect(store.activeProfileDisplayName).toBe(TRANSLATED_DEFAULT_NAME);
        });

        it('should return profile name for custom active profile', () => {
            store.setProfilesData(MOCK_PROFILES_DATA);

            expect(store.activeProfileDisplayName).toBe('Work');
        });
    });

    describe('setActiveProfile', () => {
        it('should call messenger.switchProfile', () => {
            store.setActiveProfile(CUSTOM_PROFILE.id);
            expect(mockMessenger.switchProfile).toHaveBeenCalledWith(CUSTOM_PROFILE.id);
        });

        it('should not call messenger when profile is already active', () => {
            store.setProfilesData(MOCK_PROFILES_DATA);
            store.setActiveProfile(CUSTOM_PROFILE.id);
            expect(mockMessenger.switchProfile).not.toHaveBeenCalled();
        });
    });

    describe('exclusionsCache', () => {
        const EXCLUSIONS_TREE = {
            id: 'root',
            parentId: null,
            hostname: '',
            state: ExclusionState.Disabled,
            type: ExclusionsType.Group,
            children: [],
        };

        const mockDataWithExclusions: ProfilesOptionsData = {
            ...MOCK_PROFILES_DATA,
            profileExclusionsData: {
                [DEFAULT_PROFILE_ID]: {
                    exclusionsData: {
                        exclusions: EXCLUSIONS_TREE,
                        currentMode: ExclusionsMode.Regular,
                    },
                    services: [],
                    isAllExclusionsListsEmpty: true,
                },
                work: {
                    exclusionsData: {
                        exclusions: {
                            ...EXCLUSIONS_TREE,
                            children: [
                                {
                                    id: 'example.com',
                                    parentId: 'root',
                                    hostname: 'example.com',
                                    state: ExclusionState.Enabled,
                                    type: ExclusionsType.Group,
                                    children: [],
                                },
                            ],
                        },
                        currentMode: ExclusionsMode.Selective,
                    },
                    services: [],
                    isAllExclusionsListsEmpty: false,
                },
            },
        };

        it('should fill exclusions cache from setProfilesData', () => {
            store.setProfilesData(mockDataWithExclusions);

            expect(store.exclusionsCache[DEFAULT_PROFILE_ID]).toBeDefined();
            expect(store.exclusionsCache.work).toBeDefined();
        });

        it('should store correct mode per profile', () => {
            store.setProfilesData(mockDataWithExclusions);

            expect(store.exclusionsCache[DEFAULT_PROFILE_ID]?.currentMode).toBe(ExclusionsMode.Regular);
            expect(store.exclusionsCache.work?.currentMode).toBe(ExclusionsMode.Selective);
        });

        it('should store correct isAllExclusionsListsEmpty per profile', () => {
            store.setProfilesData(mockDataWithExclusions);

            expect(store.exclusionsCache[DEFAULT_PROFILE_ID]?.isAllExclusionsListsEmpty).toBe(true);
            expect(store.exclusionsCache.work?.isAllExclusionsListsEmpty).toBe(false);
        });

        it('should clear old cache entries on reload', () => {
            store.setProfilesData(mockDataWithExclusions);
            expect(store.exclusionsCache.work).toBeDefined();

            // Reload with data that only has default profile
            store.setProfilesData({
                ...MOCK_PROFILES_DATA,
                profileExclusionsData: {
                    [DEFAULT_PROFILE_ID]: mockDataWithExclusions.profileExclusionsData[DEFAULT_PROFILE_ID],
                },
            });

            expect(store.exclusionsCache.work).toBeUndefined();
        });

        it('should update a single profile cache entry via updateExclusionsCache', () => {
            store.setProfilesData(mockDataWithExclusions);

            const updatedTree = {
                ...EXCLUSIONS_TREE,
                children: [
                    {
                        id: 'new.com',
                        parentId: 'root',
                        hostname: 'new.com',
                        state: ExclusionState.Enabled,
                        type: ExclusionsType.Group,
                        children: [],
                    },
                ],
            };

            store.updateExclusionsCache(
                'work',
                { exclusions: updatedTree, currentMode: ExclusionsMode.Regular },
                [],
                true,
            );

            const entry = store.exclusionsCache.work;
            expect(entry?.currentMode).toBe(ExclusionsMode.Regular);
            expect(entry?.exclusionsTree.children).toHaveLength(1);
            expect(entry?.exclusionsTree.children[0].hostname).toBe('new.com');
            expect(entry?.isAllExclusionsListsEmpty).toBe(true);
        });

        it('should convert punycode hostnames to unicode in cache', () => {
            const punycodeTree = {
                ...EXCLUSIONS_TREE,
                children: [
                    {
                        id: 'xn--80aswg.xn--p1ai',
                        parentId: 'root',
                        hostname: 'xn--80aswg.xn--p1ai',
                        state: ExclusionState.Enabled,
                        type: ExclusionsType.Group,
                        children: [],
                    },
                ],
            };

            store.updateExclusionsCache(
                DEFAULT_PROFILE_ID,
                { exclusions: punycodeTree, currentMode: ExclusionsMode.Regular },
                [],
                false,
            );

            const entry = store.exclusionsCache[DEFAULT_PROFILE_ID];
            expect(entry?.exclusionsTree.children[0].hostname).toBe('сайт.рф');
        });
    });

    describe('isSwitchingProfile', () => {
        it('should apply switchingProfileId from initial data when no event arrived yet', () => {
            store.setProfilesData({ ...MOCK_PROFILES_DATA, switchingProfileId: CUSTOM_PROFILE.id });

            expect(store.isSwitchingProfile).toBe(true);
            expect(store.activeProfileId).toBe(CUSTOM_PROFILE.id);
        });

        it('should keep isSwitchingProfile=false when initial data has null', () => {
            store.setProfilesData({ ...MOCK_PROFILES_DATA, switchingProfileId: null });

            expect(store.isSwitchingProfile).toBe(false);
        });

        it('should update isSwitchingProfile via setSwitchingProfile', () => {
            store.startSwitchingProfile(CUSTOM_PROFILE.id);
            expect(store.isSwitchingProfile).toBe(true);
            expect(store.activeProfileId).toBe(CUSTOM_PROFILE.id);

            store.handleProfileChanged({
                profileId: CUSTOM_PROFILE.id,
                success: true,
            });
            expect(store.isSwitchingProfile).toBe(false);
        });

        it('should not overwrite event-driven state with stale initial data', () => {
            // Simulate: event arrives before getOptionsData response is applied
            store.handleProfileChanged({
                profileId: CUSTOM_PROFILE.id,
                success: true,

            });

            // Now stale initial data says switching is in progress
            store.setProfilesData({ ...MOCK_PROFILES_DATA, switchingProfileId: ANOTHER_PROFILE.id });

            // Event-driven value wins — no stuck spinner
            expect(store.isSwitchingProfile).toBe(false);
        });

        it('should not overwrite event-driven true state with stale null', () => {
            // Simulate: PROFILE_SWITCH_IN_PROGRESS event arrived first
            store.startSwitchingProfile(CUSTOM_PROFILE.id);

            // Stale initial data says no switching (response was built before the event)
            store.setProfilesData({ ...MOCK_PROFILES_DATA, switchingProfileId: null });

            // Event-driven value wins
            expect(store.isSwitchingProfile).toBe(true);
        });

        it('should not roll back activeProfileId when stale initial data arrives during switch', () => {
            // Live event sets optimistic activeProfileId = ANOTHER_PROFILE
            store.startSwitchingProfile(ANOTHER_PROFILE.id);
            expect(store.activeProfileId).toBe(ANOTHER_PROFILE.id);

            // Stale initial data has activeProfileId = CUSTOM_PROFILE (old) and no switching
            store.setProfilesData({
                ...MOCK_PROFILES_DATA,
                profilesState: { ...PROFILES_STATE, activeProfileId: CUSTOM_PROFILE.id },
                switchingProfileId: null,
            });

            // Live value wins — activeProfileId must stay on the target
            expect(store.activeProfileId).toBe(ANOTHER_PROFILE.id);
            expect(store.isSwitchingProfile).toBe(true);
        });

        it('should not roll back activeProfileId when stale data arrives after completed switch', () => {
            // Live event: switch completed to ANOTHER_PROFILE
            store.handleProfileChanged({
                profileId: ANOTHER_PROFILE.id,
                success: true,
            });
            expect(store.activeProfileId).toBe(ANOTHER_PROFILE.id);

            // Stale initial data still has old activeProfileId
            store.setProfilesData({
                ...MOCK_PROFILES_DATA,
                profilesState: { ...PROFILES_STATE, activeProfileId: CUSTOM_PROFILE.id },
                switchingProfileId: ANOTHER_PROFILE.id,
            });

            // Live value wins
            expect(store.activeProfileId).toBe(ANOTHER_PROFILE.id);
            expect(store.isSwitchingProfile).toBe(false);
        });

        /**
         * Simulates the real page initialization race condition:
         *
         * 1. useSubscribeNotifier() starts async subscription (fast, ~5ms)
         * 2. globalStore.init() calls getOptionsData() (slow, ~50ms)
         * 3. Subscription completes → events start flowing
         * 4. Background emits ACTIVE_PROFILE_CHANGED → handleProfileChanged
         * 5. getOptionsData response arrives with stale switchingProfileId
         * 6. setProfilesData() called — must NOT overwrite the fresher event
         *
         * Without hasReceivedSwitchEvent guard, the spinner would get stuck.
         */
        it('should handle race between async subscription and stale getOptionsData response', async () => {
            const subscriptionReady = new Promise<void>((resolve) => {
                setTimeout(resolve, 5);
            });

            const getOptionsDataResponse = new Promise<ProfilesOptionsData>((resolve) => {
                setTimeout(() => {
                    resolve({ ...MOCK_PROFILES_DATA, switchingProfileId: CUSTOM_PROFILE.id });
                }, 20);
            });

            await subscriptionReady;

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    store.handleProfileChanged({
                        profileId: CUSTOM_PROFILE.id,
                        success: true,
                    });
                    resolve();
                }, 10);
            });

            const staleData = await getOptionsDataResponse;
            store.setProfilesData(staleData);

            expect(store.isSwitchingProfile).toBe(false);
        });

        it('should handle race where event sets switching after stale response says null', async () => {
            const getOptionsDataResponse = new Promise<ProfilesOptionsData>((resolve) => {
                setTimeout(() => {
                    resolve({ ...MOCK_PROFILES_DATA, switchingProfileId: null });
                }, 20);
            });

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    store.startSwitchingProfile(CUSTOM_PROFILE.id);
                    resolve();
                }, 10);
            });

            const staleData = await getOptionsDataResponse;
            store.setProfilesData(staleData);

            expect(store.isSwitchingProfile).toBe(true);
        });
    });

    describe('handleProfileChanged notifications', () => {
        it('should not show notification on successful switch', () => {
            store.handleProfileChanged({
                profileId: CUSTOM_PROFILE.id,
                success: true,
            });

            expect(mockNotificationsStore.notifySuccess).not.toHaveBeenCalled();
            expect(mockNotificationsStore.notifyError).not.toHaveBeenCalled();
        });

        it('should show error notification on failed switch', () => {
            store.handleProfileChanged({
                profileId: CUSTOM_PROFILE.id,
                success: false,
            });

            expect(mockNotificationsStore.notifyError).toHaveBeenCalledTimes(1);
            expect(mockNotificationsStore.notifySuccess).not.toHaveBeenCalled();
        });

        it('should show error notification on failed delete-fallback', () => {
            store.handleProfileChanged({
                profileId: DEFAULT_PROFILE.id,
                success: false,
            });

            expect(mockNotificationsStore.notifyError).toHaveBeenCalledTimes(1);
            expect(mockNotificationsStore.notifySuccess).not.toHaveBeenCalled();
        });

        it('should still update state on delete-fallback even without notification', () => {
            store.startSwitchingProfile(CUSTOM_PROFILE.id);

            store.handleProfileChanged({
                profileId: DEFAULT_PROFILE.id,
                success: true,
            });

            expect(store.isSwitchingProfile).toBe(false);
            expect(store.activeProfileId).toBe(DEFAULT_PROFILE.id);
        });
    });
});
