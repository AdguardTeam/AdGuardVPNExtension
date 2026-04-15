import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import {
    ProfileKind,
    StorageKey,
    DEFAULT_PROFILE_ID,
    DEFAULT_PROFILE_SETTINGS,
    MAX_PROFILES_COUNT,
    type ProfilesState,
    type Profile,
} from '../../../src/background/schema';
import { ProfilesService } from '../../../src/background/profiles/ProfilesService';
import { browserApi } from '../../../src/background/browserApi';

vi.mock('../../../src/background/browserApi', () => {
    const storage: Record<string, unknown> = {};
    return {
        browserApi: {
            storage: {
                get: vi.fn(async (key: string) => storage[key]),
                set: vi.fn(async (key: string, data: unknown) => { storage[key] = data; }),
                remove: vi.fn(async (key: string) => { delete storage[key]; }),
            },
        },
    };
});

const DEFAULT_PROFILE_NAME = 'Default';

vi.mock('../../../src/common/translator', () => ({
    translator: {
        getMessage: vi.fn(() => DEFAULT_PROFILE_NAME),
    },
}));

describe('ProfilesService', () => {
    let service: ProfilesService;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Clear any stored profile data so each test starts fresh
        await browserApi.storage.remove(StorageKey.ProfilesState);

        service = new ProfilesService();
    });

    describe('getState', () => {
        it('should return the default profile on fresh state', async () => {
            const { profiles, activeProfileId } = await service.getState();

            expect(profiles).toHaveLength(1);
            expect(profiles[0].id).toBe(DEFAULT_PROFILE_ID);
            expect(profiles[0].kind).toBe(ProfileKind.Default);
            expect(profiles[0].name).toBe(DEFAULT_PROFILE_NAME);
            expect(activeProfileId).toBe(DEFAULT_PROFILE_ID);
        });

        it('should reset to defaults when stored data is corrupted', async () => {
            await browserApi.storage.set(StorageKey.ProfilesState, {
                activeProfileId: 123,
                profiles: 'not-an-array',
            });

            const { profiles, activeProfileId } = await service.getState();

            expect(profiles).toHaveLength(1);
            expect(profiles[0].id).toBe(DEFAULT_PROFILE_ID);
            expect(activeProfileId).toBe(DEFAULT_PROFILE_ID);
        });

        it('should reset to defaults when stored data has missing fields', async () => {
            await browserApi.storage.set(StorageKey.ProfilesState, {
                activeProfileId: 'some-id',
            });

            const { profiles, activeProfileId } = await service.getState();

            expect(profiles).toHaveLength(1);
            expect(profiles[0].id).toBe(DEFAULT_PROFILE_ID);
            expect(activeProfileId).toBe(DEFAULT_PROFILE_ID);
        });

        it('should restore the default profile when it is missing from storage', async () => {
            const stateWithoutDefault: ProfilesState = {
                activeProfileId: 'custom-1',
                profiles: [
                    {
                        id: 'custom-1',
                        kind: ProfileKind.Custom,
                        name: 'Work',
                        settings: { ...DEFAULT_PROFILE_SETTINGS },
                    },
                ],
            };
            await browserApi.storage.set(StorageKey.ProfilesState, stateWithoutDefault);

            const { profiles } = await service.getState();

            const defaultProfile = profiles.find((p) => p.id === DEFAULT_PROFILE_ID);
            expect(defaultProfile).toBeDefined();
            expect(defaultProfile?.kind).toBe(ProfileKind.Default);
        });

        it('should fix activeProfileId when it references a missing profile', async () => {
            const stateWithBadActive: ProfilesState = {
                activeProfileId: 'non-existent-id',
                profiles: [
                    {
                        id: DEFAULT_PROFILE_ID,
                        kind: ProfileKind.Default,
                        name: '',
                        settings: { ...DEFAULT_PROFILE_SETTINGS },
                    },
                ],
            };
            await browserApi.storage.set(StorageKey.ProfilesState, stateWithBadActive);

            const { activeProfileId } = await service.getState();

            expect(activeProfileId).toBe(DEFAULT_PROFILE_ID);
        });

        it('should trim profiles when count exceeds the limit', async () => {
            const profiles: Profile[] = [
                {
                    id: DEFAULT_PROFILE_ID,
                    kind: ProfileKind.Default as const,
                    name: '',
                    settings: { ...DEFAULT_PROFILE_SETTINGS },
                },
            ];
            for (let i = 0; i < MAX_PROFILES_COUNT + 5; i += 1) {
                profiles.push({
                    id: `custom-${i}`,
                    kind: ProfileKind.Custom as const,
                    name: `Profile ${i}`,
                    settings: { ...DEFAULT_PROFILE_SETTINGS },
                });
            }
            await browserApi.storage.set(StorageKey.ProfilesState, {
                activeProfileId: DEFAULT_PROFILE_ID,
                profiles,
            });

            const state = await service.getState();

            expect(state.profiles).toHaveLength(MAX_PROFILES_COUNT);
            expect(state.profiles[0].kind).toBe(ProfileKind.Default);
        });

        it('should reset activeProfileId to default when trimming removes the active profile', async () => {
            const profiles: Profile[] = [
                {
                    id: DEFAULT_PROFILE_ID,
                    kind: ProfileKind.Default as const,
                    name: '',
                    settings: { ...DEFAULT_PROFILE_SETTINGS },
                },
            ];
            for (let i = 0; i < MAX_PROFILES_COUNT + 5; i += 1) {
                profiles.push({
                    id: `custom-${i}`,
                    kind: ProfileKind.Custom as const,
                    name: `Profile ${i}`,
                    settings: { ...DEFAULT_PROFILE_SETTINGS },
                });
            }
            // Set active to a profile that will be trimmed (last custom profile)
            const lastId = `custom-${MAX_PROFILES_COUNT + 4}`;
            await browserApi.storage.set(StorageKey.ProfilesState, {
                activeProfileId: lastId,
                profiles,
            });

            const { activeProfileId } = await service.getState();

            expect(activeProfileId).toBe(DEFAULT_PROFILE_ID);
        });
    });

    describe('createProfile', () => {
        it('should create a profile with default settings', async () => {
            const profile = await service.createProfile('Work');

            expect(profile.name).toBe('Work');
            expect(profile.kind).toBe(ProfileKind.Custom);
            expect(profile.settings).toEqual(DEFAULT_PROFILE_SETTINGS);
            expect(profile.id).toBeTruthy();

            const { profiles } = await service.getState();
            expect(profiles).toHaveLength(2);
        });

        it('should not share nested settings objects between profiles', async () => {
            const profileA = await service.createProfile('A');
            const profileB = await service.createProfile('B');

            const { profiles } = await service.getState();
            const settingsA = profiles.find((p) => p.id === profileA.id)!.settings;
            const settingsB = profiles.find((p) => p.id === profileB.id)!.settings;

            expect(settingsA.exclusions).not.toBe(settingsB.exclusions);
            expect(settingsA.customDnsServers).not.toBe(settingsB.customDnsServers);
        });

        it('should allow duplicate names', async () => {
            await service.createProfile('Work');
            const second = await service.createProfile('Work');

            expect(second.name).toBe('Work');

            const { profiles } = await service.getState();
            expect(profiles).toHaveLength(3);
        });

        it('should throw when the limit is reached', async () => {
            const customCount = MAX_PROFILES_COUNT - 1;
            for (let i = 0; i < customCount; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await service.createProfile(`Profile ${i}`);
            }

            const { profiles } = await service.getState();
            expect(profiles).toHaveLength(MAX_PROFILES_COUNT);

            await expect(service.createProfile('One too many'))
                .rejects
                .toThrow(`limit of ${MAX_PROFILES_COUNT}`);
        });
    });

    describe('renameProfile', () => {
        it('should rename a custom profile', async () => {
            const profile = await service.createProfile('Old Name');

            await service.renameProfile(profile.id, 'New Name');

            const { profiles } = await service.getState();
            const renamed = profiles.find((p) => p.id === profile.id);
            expect(renamed?.name).toBe('New Name');
        });

        it('should throw when renaming the default profile', async () => {
            await expect(service.renameProfile(DEFAULT_PROFILE_ID, 'Custom'))
                .rejects
                .toThrow('Cannot rename the system default profile');
        });

        it('should throw when profile is not found', async () => {
            await expect(service.renameProfile('non-existent', 'Name'))
                .rejects
                .toThrow('Profile not found');
        });
    });

    describe('deleteProfile', () => {
        it('should delete a custom profile', async () => {
            const profile = await service.createProfile('To Delete');

            await service.deleteProfile(profile.id);

            const { profiles } = await service.getState();
            expect(profiles).toHaveLength(1);
            expect(profiles[0].id).toBe(DEFAULT_PROFILE_ID);
        });

        it('should throw when deleting the default profile', async () => {
            await expect(service.deleteProfile(DEFAULT_PROFILE_ID))
                .rejects
                .toThrow('Cannot delete the system default profile');
        });

        it('should switch to default when deleting the active profile', async () => {
            const profile = await service.createProfile('Active');
            await service.setActiveProfile(profile.id);

            await service.deleteProfile(profile.id);

            const { activeProfileId } = await service.getState();
            expect(activeProfileId).toBe(DEFAULT_PROFILE_ID);
        });

        it('should not change active profile when deleting a non-active profile', async () => {
            const profileA = await service.createProfile('A');
            await service.createProfile('B');
            await service.setActiveProfile(profileA.id);

            const profileB = (await service.getState()).profiles.find((p) => p.name === 'B');
            await service.deleteProfile(profileB!.id);

            const { activeProfileId } = await service.getState();
            expect(activeProfileId).toBe(profileA.id);
        });
    });

    describe('setActiveProfile', () => {
        it('should change the active profile', async () => {
            const profile = await service.createProfile('Work');

            await service.setActiveProfile(profile.id);

            const { activeProfileId } = await service.getState();
            expect(activeProfileId).toBe(profile.id);
        });

        it('should be a no-op when switching to the already-active profile', async () => {
            // Trigger initial loadState so its storage.set call is excluded
            await service.getState();

            const callsBefore = (browserApi.storage.set as ReturnType<typeof vi.fn>).mock.calls.length;

            await service.setActiveProfile(DEFAULT_PROFILE_ID);

            const callsAfter = (browserApi.storage.set as ReturnType<typeof vi.fn>).mock.calls.length;
            expect(callsAfter).toBe(callsBefore);
        });

        it('should throw when profile is not found', async () => {
            await expect(service.setActiveProfile('non-existent'))
                .rejects
                .toThrow('Profile not found');
        });
    });

    describe('updateProfileSettings', () => {
        it('should update the settings of a profile', async () => {
            const profile = await service.createProfile('Work');
            const newSettings = {
                ...DEFAULT_PROFILE_SETTINGS,
                handleWebRtcEnabled: true,
                selectedDnsServer: 'adguard-dns',
            };

            await service.updateProfileSettings(profile.id, newSettings);

            const { profiles } = await service.getState();
            const updated = profiles.find((p) => p.id === profile.id);
            expect(updated?.settings.handleWebRtcEnabled).toBe(true);
            expect(updated?.settings.selectedDnsServer).toBe('adguard-dns');
        });

        it('should throw when profile is not found', async () => {
            await expect(service.updateProfileSettings('non-existent', DEFAULT_PROFILE_SETTINGS))
                .rejects
                .toThrow('Profile not found');
        });

        it('should throw when settings are invalid', async () => {
            const profile = await service.createProfile('Work');
            const invalidSettings = {
                selectedLocationId: null,
                handleWebRtcEnabled: 'not-a-boolean',
                selectedDnsServer: 123,
            };

            await expect(
                service.updateProfileSettings(profile.id, invalidSettings as any),
            ).rejects.toThrow();
        });
    });
});
