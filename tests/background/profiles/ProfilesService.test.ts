import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { StorageKey, DEFAULT_PROFILE_SETTINGS, type ProfilesState } from '../../../src/background/schema';
import {
    DEFAULT_PROFILE_ID,
    MAX_PROFILES_COUNT,
    MAX_PROFILE_NAME_LENGTH,
    ProfileNameError,
    isDefaultProfileId,
} from '../../../src/common/profilesConstants';
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
            expect(isDefaultProfileId(profiles[0].id)).toBe(true);
            expect(profiles[0].name).toBe('');
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

        it('should not write to storage on read', async () => {
            const validState: ProfilesState = {
                activeProfileId: DEFAULT_PROFILE_ID,
                profiles: [
                    {
                        id: DEFAULT_PROFILE_ID,
                        name: '',
                        settings: { ...DEFAULT_PROFILE_SETTINGS },
                    },
                ],
            };
            await browserApi.storage.set(StorageKey.ProfilesState, validState);
            (browserApi.storage.set as ReturnType<typeof vi.fn>).mockClear();

            await service.getState();

            expect(browserApi.storage.set).not.toHaveBeenCalled();
        });
    });

    describe('createProfile', () => {
        it('should create a profile with default settings', async () => {
            const profile = await service.createProfile('Work');

            expect(profile.name).toBe('Work');
            expect(isDefaultProfileId(profile.id)).toBe(false);
            expect(profile.settings).toEqual(DEFAULT_PROFILE_SETTINGS);
            expect(profile.id).toBeTruthy();

            const { profiles } = await service.getState();
            expect(profiles).toHaveLength(2);
        });

        it('should not lose profiles when createProfile is called concurrently', async () => {
            const [profileA, profileB] = await Promise.all([
                service.createProfile('A'),
                service.createProfile('B'),
            ]);

            const { profiles } = await service.getState();

            expect(profiles).toHaveLength(3);
            expect(profiles.find((p) => p.id === profileA.id)).toBeDefined();
            expect(profiles.find((p) => p.id === profileB.id)).toBeDefined();
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

        it('should throw when name is empty', async () => {
            await expect(service.createProfile(''))
                .rejects
                .toThrow(ProfileNameError.Empty);
        });

        it('should throw when name is whitespace-only', async () => {
            await expect(service.createProfile('   '))
                .rejects
                .toThrow(ProfileNameError.Empty);
        });

        it('should throw when name exceeds max length', async () => {
            const longName = 'a'.repeat(MAX_PROFILE_NAME_LENGTH + 1);
            await expect(service.createProfile(longName))
                .rejects
                .toThrow(ProfileNameError.TooLong);
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

        it('should throw when new name is empty', async () => {
            const profile = await service.createProfile('Original');
            await expect(service.renameProfile(profile.id, ''))
                .rejects
                .toThrow(ProfileNameError.Empty);
        });

        it('should throw when new name exceeds max length', async () => {
            const profile = await service.createProfile('Original');
            const longName = 'a'.repeat(MAX_PROFILE_NAME_LENGTH + 1);
            await expect(service.renameProfile(profile.id, longName))
                .rejects
                .toThrow(ProfileNameError.TooLong);
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
        it('should merge a partial patch into existing settings', async () => {
            const profile = await service.createProfile('Work');

            await service.updateProfileSettings(profile.id, {
                handleWebRtcEnabled: true,
                selectedDnsServer: 'adguard-dns',
            });

            const { profiles } = await service.getState();
            const updated = profiles.find((p) => p.id === profile.id);
            expect(updated?.settings.handleWebRtcEnabled).toBe(true);
            expect(updated?.settings.selectedDnsServer).toBe('adguard-dns');
            // Untouched fields should keep their defaults
            expect(updated?.settings.selectedLocationId).toBe(DEFAULT_PROFILE_SETTINGS.selectedLocationId);
        });

        it('should throw when profile is not found', async () => {
            await expect(service.updateProfileSettings('non-existent', { handleWebRtcEnabled: true }))
                .rejects
                .toThrow('Profile not found');
        });

        it('should allow updating the default profile settings', async () => {
            await service.updateProfileSettings(DEFAULT_PROFILE_ID, { handleWebRtcEnabled: true });

            const { profiles } = await service.getState();
            const defaultProfile = profiles.find((p) => p.id === DEFAULT_PROFILE_ID);
            expect(defaultProfile?.settings.handleWebRtcEnabled).toBe(true);
        });

        it('should throw when patch produces invalid settings', async () => {
            const profile = await service.createProfile('Work');

            await expect(
                service.updateProfileSettings(profile.id, {
                    // @ts-expect-error testing with intentionally invalid value
                    handleWebRtcEnabled: 'not-a-boolean',
                }),
            ).rejects.toThrow();
        });

        it('should call onApply when updating the active profile', async () => {
            const onApply = vi.fn();

            await service.updateProfileSettings(
                DEFAULT_PROFILE_ID,
                { handleWebRtcEnabled: true },
                onApply,
            );

            expect(onApply).toHaveBeenCalledOnce();
        });

        it('should NOT call onApply when updating a non-active profile', async () => {
            const profile = await service.createProfile('Work');
            const onApply = vi.fn();

            await service.updateProfileSettings(
                profile.id,
                { handleWebRtcEnabled: true },
                onApply,
            );

            expect(onApply).not.toHaveBeenCalled();
        });

        it('should persist settings even when onApply is not provided', async () => {
            await service.updateProfileSettings(DEFAULT_PROFILE_ID, { handleWebRtcEnabled: true });

            const settings = await service.getActiveProfileSettings();
            expect(settings.handleWebRtcEnabled).toBe(true);
        });
    });

    describe('getProfileInfoList', () => {
        it('should return lightweight descriptors with id and name only', async () => {
            await service.createProfile('Work');
            await service.createProfile('Gaming');

            const { profiles, activeProfileId } = await service.getProfileInfoList();

            expect(profiles).toHaveLength(3);
            expect(activeProfileId).toBe(DEFAULT_PROFILE_ID);
            profiles.forEach((p) => {
                expect(Object.keys(p).sort()).toEqual(['id', 'name']);
            });
        });

        it('should not include settings in the result', async () => {
            await service.createProfile('Work');

            const { profiles } = await service.getProfileInfoList();

            profiles.forEach((p) => {
                expect(p).not.toHaveProperty('settings');
            });
        });
    });

    describe('getActiveProfileSettings', () => {
        it('should return the default profile settings on fresh state', async () => {
            const settings = await service.getActiveProfileSettings();

            expect(settings).toEqual(DEFAULT_PROFILE_SETTINGS);
        });

        it('should return the settings of the currently active profile', async () => {
            const profile = await service.createProfile('Work');
            await service.updateProfileSettings(profile.id, { handleWebRtcEnabled: true });
            await service.setActiveProfile(profile.id);

            const settings = await service.getActiveProfileSettings();

            expect(settings.handleWebRtcEnabled).toBe(true);
        });

        it('should return a deep copy that cannot mutate the internal state', async () => {
            const settingsA = await service.getActiveProfileSettings();
            settingsA.handleWebRtcEnabled = true;

            const settingsB = await service.getActiveProfileSettings();
            expect(settingsB.handleWebRtcEnabled).toBe(DEFAULT_PROFILE_SETTINGS.handleWebRtcEnabled);
        });
    });
});
