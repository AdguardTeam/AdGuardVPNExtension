import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import {
    ProfileKind,
    DEFAULT_PROFILE_ID,
    DEFAULT_PROFILE_SETTINGS,
    MAX_PROFILES_COUNT,
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

describe('ProfilesService', () => {
    let service: ProfilesService;

    beforeEach(async () => {
        vi.clearAllMocks();

        // Clear any stored profile data so each test starts fresh
        await browserApi.storage.remove('profilesState');

        service = new ProfilesService();
    });

    describe('getState', () => {
        it('should return the default profile on fresh state', async () => {
            const { profiles, activeProfileId } = await service.getState();

            expect(profiles).toHaveLength(1);
            expect(profiles[0].id).toBe(DEFAULT_PROFILE_ID);
            expect(profiles[0].kind).toBe(ProfileKind.Default);
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
            // Set active to default, then check storage wasn't called again
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
    });
});
