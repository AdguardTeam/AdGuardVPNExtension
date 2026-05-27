import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import {
    DEFAULT_PROFILE_SETTINGS,
    PROFILES_STATE_DEFAULTS,
    type ProfilesState,
    type LocationInterface,
} from '../../../src/background/schema';
import {
    DEFAULT_PROFILE_ID,
    MAX_PROFILES_COUNT,
    MAX_PROFILE_NAME_LENGTH,
    ProfileNameValidationResult,
    isDefaultProfileId,
    type ProfileOperationResponse,
} from '../../../src/common/profiles';
import { ProfilesService } from '../../../src/background/profiles/ProfilesService';
import { settings } from '../../../src/background/settings';

let mockState: ProfilesState = structuredClone(PROFILES_STATE_DEFAULTS);

/**
 * Asserts the operation succeeded and returns the profile ID.
 */
function expectOk(response: ProfileOperationResponse): string {
    expect(response.result).toBe(ProfileNameValidationResult.Ok);
    if (response.result !== ProfileNameValidationResult.Ok) {
        throw new Error('Expected Ok result');
    }
    return response.profileId;
}

vi.mock('../../../src/background/settings', () => ({
    settings: {
        getProfilesState: vi.fn(() => mockState),
        setProfilesState: vi.fn((state: ProfilesState) => { mockState = state; }),
    },
}));

describe('ProfilesService', () => {
    let service: ProfilesService;

    beforeEach(() => {
        vi.clearAllMocks();
        mockState = structuredClone(PROFILES_STATE_DEFAULTS);
        service = new ProfilesService();
    });

    describe('getState', () => {
        it('should return the default profile on fresh state', async () => {
            const { profiles, activeProfileId } = await service.getProfilesData();

            expect(profiles).toHaveLength(1);
            expect(profiles[0].id).toBe(DEFAULT_PROFILE_ID);
            expect(isDefaultProfileId(profiles[0].id)).toBe(true);
            expect(profiles[0].name).toBe('');
            expect(activeProfileId).toBe(DEFAULT_PROFILE_ID);
        });

        it('should not write to storage on read', async () => {
            (settings.setProfilesState as ReturnType<typeof vi.fn>).mockClear();

            await service.getProfilesData();

            expect(settings.setProfilesState).not.toHaveBeenCalled();
        });
    });

    describe('createProfile', () => {
        it('should create a profile with default settings', async () => {
            const profileId = expectOk(await service.createProfile('Work'));

            const { profiles } = await service.getProfilesData();
            expect(profiles).toHaveLength(2);

            const profile = profiles.find((p) => p.id === profileId)!;
            expect(profile.name).toBe('Work');
            expect(isDefaultProfileId(profile.id)).toBe(false);
            expect(profile.settings).toEqual(DEFAULT_PROFILE_SETTINGS);
        });

        it('should inherit selectedLocation from the active profile', async () => {
            const mockLocation: LocationInterface = {
                id: 'us-nyc',
                countryName: 'United States',
                cityName: 'New York',
                countryCode: 'US',
                endpoints: [],
                coordinates: [40.7128, -74.006] as [number, number],
                premiumOnly: false,
                pingBonus: 0,
                virtual: false,
                ping: 42,
            };

            // Set a selected location on the active (default) profile.
            await service.updateProfileSettings(
                DEFAULT_PROFILE_ID,
                { selectedLocation: mockLocation },
            );

            const profileId = expectOk(await service.createProfile('WithLocation'));

            const { profiles } = await service.getProfilesData();
            const created = profiles.find((p) => p.id === profileId)!;
            expect(created.settings.selectedLocation).toEqual(mockLocation);
        });

        it('should not share selectedLocation reference with the source profile', async () => {
            const mockLocation: LocationInterface = {
                id: 'de-ber',
                countryName: 'Germany',
                cityName: 'Berlin',
                countryCode: 'DE',
                endpoints: [],
                coordinates: [52.52, 13.405] as [number, number],
                premiumOnly: false,
                pingBonus: 0,
                virtual: false,
                ping: 30,
            };

            await service.updateProfileSettings(
                DEFAULT_PROFILE_ID,
                { selectedLocation: mockLocation },
            );

            const profileId = expectOk(await service.createProfile('Detached'));

            const { profiles } = await service.getProfilesData();
            const source = profiles.find((p) => p.id === DEFAULT_PROFILE_ID)!;
            const created = profiles.find((p) => p.id === profileId)!;
            expect(created.settings.selectedLocation).not.toBe(source.settings.selectedLocation);
        });

        it('should not lose profiles when createProfile is called concurrently', async () => {
            const [responseA, responseB] = await Promise.all([
                service.createProfile('A'),
                service.createProfile('B'),
            ]);

            const { profiles } = await service.getProfilesData();

            expect(profiles).toHaveLength(3);
            expect(profiles.find((p) => p.id === expectOk(responseA))).toBeDefined();
            expect(profiles.find((p) => p.id === expectOk(responseB))).toBeDefined();
        });

        it('should not share nested settings objects between profiles', async () => {
            const idA = expectOk(await service.createProfile('A'));
            const idB = expectOk(await service.createProfile('B'));

            const { profiles } = await service.getProfilesData();
            const settingsA = profiles.find((p) => p.id === idA)?.settings!;
            const settingsB = profiles.find((p) => p.id === idB)?.settings!;

            expect(settingsA.exclusions).not.toBe(settingsB.exclusions);
            expect(settingsA.customDnsServers).not.toBe(settingsB.customDnsServers);
        });

        it('should return DuplicateName when name is already used', async () => {
            await service.createProfile('Work');

            const response = await service.createProfile('Work');

            expect(response.result).toBe(ProfileNameValidationResult.DuplicateName);
        });

        it('should return DuplicateName when name is already used (case-insensitive)', async () => {
            await service.createProfile('Work');

            const response = await service.createProfile('work');

            expect(response.result).toBe(ProfileNameValidationResult.DuplicateName);
        });

        it('should throw when the limit is reached', async () => {
            const customCount = MAX_PROFILES_COUNT - 1;
            for (let i = 0; i < customCount; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await service.createProfile(`Profile ${i}`);
            }

            const { profiles } = await service.getProfilesData();
            expect(profiles).toHaveLength(MAX_PROFILES_COUNT);

            await expect(service.createProfile('One too many'))
                .rejects
                .toThrow(`limit of ${MAX_PROFILES_COUNT}`);
        });

        it('should return Empty when name is empty', async () => {
            const response = await service.createProfile('');

            expect(response.result).toBe(ProfileNameValidationResult.Empty);
        });

        it('should return Empty when name is whitespace-only', async () => {
            const response = await service.createProfile('   ');

            expect(response.result).toBe(ProfileNameValidationResult.Empty);
        });

        it('should return TooLong when name exceeds max length', async () => {
            const longName = 'a'.repeat(MAX_PROFILE_NAME_LENGTH + 1);
            const response = await service.createProfile(longName);

            expect(response.result).toBe(ProfileNameValidationResult.TooLong);
        });

        it('should return a detached copy that does not affect internal state', async () => {
            const profileId = expectOk(await service.createProfile('Immutable'));

            const { profiles: before } = await service.getProfilesData();
            const profile = before.find((p) => p.id === profileId)!;
            profile.name = 'Mutated';
            profile.settings.handleWebRtcEnabled = true;

            const { profiles: after } = await service.getProfilesData();
            const stored = after.find((p) => p.id === profileId);
            expect(stored?.name).toBe('Immutable');
            expect(stored?.settings.handleWebRtcEnabled).toBe(false);
        });
    });

    describe('renameProfile', () => {
        it('should rename a custom profile', async () => {
            const profileId = expectOk(await service.createProfile('Old Name'));

            await service.renameProfile(profileId, 'New Name');

            const { profiles } = await service.getProfilesData();
            const renamed = profiles.find((p) => p.id === profileId);
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

        it('should return error result when new name is empty', async () => {
            const profileId = expectOk(await service.createProfile('Original'));
            const response = await service.renameProfile(profileId, '');
            expect(response.result).toBe(ProfileNameValidationResult.Empty);
        });

        it('should return error result when new name exceeds max length', async () => {
            const profileId = expectOk(await service.createProfile('Original'));
            const longName = 'a'.repeat(MAX_PROFILE_NAME_LENGTH + 1);
            const response = await service.renameProfile(profileId, longName);
            expect(response.result).toBe(ProfileNameValidationResult.TooLong);
        });

        it('should return error result when new name is already used', async () => {
            await service.createProfile('Work');
            const profileId = expectOk(await service.createProfile('Home'));

            const response = await service.renameProfile(profileId, 'Work');
            expect(response.result).toBe(ProfileNameValidationResult.DuplicateName);
        });

        it('should return error result when new name is already used (case-insensitive)', async () => {
            await service.createProfile('Work');
            const profileId = expectOk(await service.createProfile('Home'));

            const response = await service.renameProfile(profileId, 'work');
            expect(response.result).toBe(ProfileNameValidationResult.DuplicateName);
        });

        it('should allow renaming to own current name', async () => {
            const profileId = expectOk(await service.createProfile('Work'));

            await expect(service.renameProfile(profileId, 'Work'))
                .resolves
                .not.toThrow();
        });
    });

    describe('deleteProfile', () => {
        it('should delete a custom profile', async () => {
            const profileId = expectOk(await service.createProfile('To Delete'));

            await service.deleteProfile(profileId);

            const { profiles } = await service.getProfilesData();
            expect(profiles).toHaveLength(1);
            expect(profiles[0].id).toBe(DEFAULT_PROFILE_ID);
        });

        it('should throw when deleting the default profile', async () => {
            await expect(service.deleteProfile(DEFAULT_PROFILE_ID))
                .rejects
                .toThrow('Cannot delete the system default profile');
        });

        it('should switch to default when deleting the active profile', async () => {
            const profileId = expectOk(await service.createProfile('Active'));
            await service.setActiveProfile(profileId);

            await service.deleteProfile(profileId);

            const { activeProfileId } = await service.getProfilesData();
            expect(activeProfileId).toBe(profileId);
        });

        it('should not change active profile when deleting a non-active profile', async () => {
            const idA = expectOk(await service.createProfile('A'));
            const idB = expectOk(await service.createProfile('B'));
            await service.setActiveProfile(idA);

            await service.deleteProfile(idB);

            const { activeProfileId } = await service.getProfilesData();
            expect(activeProfileId).toBe(idA);
        });
    });

    describe('setActiveProfile', () => {
        it('should change the active profile', async () => {
            const profileId = expectOk(await service.createProfile('Work'));

            await service.setActiveProfile(profileId);

            const { activeProfileId } = await service.getProfilesData();
            expect(activeProfileId).toBe(profileId);
        });

        it('should be a no-op when switching to the already-active profile', async () => {
            (settings.setProfilesState as ReturnType<typeof vi.fn>).mockClear();

            await service.setActiveProfile(DEFAULT_PROFILE_ID);

            expect(settings.setProfilesState).not.toHaveBeenCalled();
        });

        it('should throw when profile is not found', async () => {
            await expect(service.setActiveProfile('non-existent'))
                .rejects
                .toThrow('Profile not found');
        });
    });

    describe('updateProfileSettings', () => {
        it('should update the settings of a profile', async () => {
            const profileId = expectOk(await service.createProfile('Work'));

            await service.updateProfileSettings(profileId, {
                handleWebRtcEnabled: true,
                selectedDnsServer: 'adguard-dns',
            });

            const { profiles } = await service.getProfilesData();
            const updated = profiles.find((p) => p.id === profileId);
            expect(updated?.settings.handleWebRtcEnabled).toBe(true);
            expect(updated?.settings.selectedDnsServer).toBe('adguard-dns');
            // Untouched fields should keep their defaults
            expect(updated?.settings.selectedLocation).toBe(DEFAULT_PROFILE_SETTINGS.selectedLocation);
        });

        it('should throw when profile is not found', async () => {
            await expect(service.updateProfileSettings('non-existent', { handleWebRtcEnabled: true }))
                .rejects
                .toThrow('Profile not found');
        });

        it('should allow updating the default profile settings', async () => {
            await service.updateProfileSettings(DEFAULT_PROFILE_ID, { handleWebRtcEnabled: true });

            const { profiles } = await service.getProfilesData();
            const defaultProfile = profiles.find((p) => p.id === DEFAULT_PROFILE_ID);
            expect(defaultProfile?.settings.handleWebRtcEnabled).toBe(true);
        });

        it('should throw when settings are invalid', async () => {
            const profileId = expectOk(await service.createProfile('Work'));

            await expect(
                service.updateProfileSettings(profileId, {
                    // @ts-expect-error testing with intentionally invalid settings
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
            const profileId = expectOk(await service.createProfile('Work'));
            const onApply = vi.fn();

            await service.updateProfileSettings(
                profileId,
                { handleWebRtcEnabled: true },
                onApply,
            );

            expect(onApply).not.toHaveBeenCalled();
        });

        it('should persist settings even when onApply is not provided', async () => {
            await service.updateProfileSettings(DEFAULT_PROFILE_ID, { handleWebRtcEnabled: true });

            const settings = service.getActiveProfileSettings();
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
            const settings = service.getActiveProfileSettings();

            expect(settings).toEqual(DEFAULT_PROFILE_SETTINGS);
        });

        it('should return the settings of the currently active profile', async () => {
            const profileId = expectOk(await service.createProfile('Work'));
            await service.updateProfileSettings(profileId, { handleWebRtcEnabled: true });
            await service.setActiveProfile(profileId);

            const settings = service.getActiveProfileSettings();

            expect(settings.handleWebRtcEnabled).toBe(true);
        });

        it('should return a deep copy that cannot mutate the internal state', async () => {
            const settingsA = service.getActiveProfileSettings();
            settingsA.handleWebRtcEnabled = true;

            const settingsB = service.getActiveProfileSettings();
            expect(settingsB.handleWebRtcEnabled).toBe(DEFAULT_PROFILE_SETTINGS.handleWebRtcEnabled);
        });
    });

    describe('getProfileSettings', () => {
        it('should return settings for the default profile', async () => {
            const settings = service.getProfileSettings(DEFAULT_PROFILE_ID);

            expect(settings).toEqual(DEFAULT_PROFILE_SETTINGS);
        });

        it('should return settings for a custom profile', async () => {
            const profileId = expectOk(await service.createProfile('Work'));
            await service.updateProfileSettings(profileId, { handleWebRtcEnabled: true });

            const settings = service.getProfileSettings(profileId);

            expect(settings.handleWebRtcEnabled).toBe(true);
        });

        it('should return a deep copy', async () => {
            const settingsA = service.getProfileSettings(DEFAULT_PROFILE_ID);
            settingsA.handleWebRtcEnabled = true;

            const settingsB = service.getProfileSettings(DEFAULT_PROFILE_ID);
            expect(settingsB.handleWebRtcEnabled).toBe(DEFAULT_PROFILE_SETTINGS.handleWebRtcEnabled);
        });

        it('should throw when profile is not found', () => {
            expect(() => service.getProfileSettings('non-existent'))
                .toThrow('Profile not found');
        });
    });

    describe('getActiveProfileId', () => {
        it('should return the default profile ID on fresh state', async () => {
            const id = service.getActiveProfileId();

            expect(id).toBe(DEFAULT_PROFILE_ID);
        });

        it('should return the currently active profile ID after switching', async () => {
            const profileId = expectOk(await service.createProfile('Work'));
            await service.setActiveProfile(profileId);

            const id = service.getActiveProfileId();

            expect(id).toBe(profileId);
        });
    });
});
