import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { CancelledError } from '../../../src/background/profiles/CancelledError';
// eslint-disable-next-line import/order -- false positive: plugin conflicts between "newlines-between: always" groups
import { DEFAULT_PROFILE_ID } from '../../../src/common/profiles';

// --- Mocks --------------------------------------------------------

const {
    mockProfilesService,
    mockDns,
    mockExclusions,
    mockLocationsService,
    mockProfileWebRtcService,
    mockLog,
    mockNotifier,
} = vi.hoisted(() => ({
    mockProfilesService: {
        getActiveProfileId: vi.fn().mockReturnValue('default'),
        setActiveProfile: vi.fn().mockResolvedValue(undefined),
        deleteProfile: vi.fn().mockResolvedValue(undefined),
    },
    mockDns: {
        applyActiveProfile: vi.fn().mockResolvedValue(undefined),
        removeProfileBackup: vi.fn().mockResolvedValue(undefined),
    },
    mockExclusions: {
        applyActiveProfile: vi.fn().mockResolvedValue(undefined),
        removeProfileData: vi.fn(),
    },
    mockLocationsService: {
        applyActiveProfile: vi.fn().mockResolvedValue(undefined),
    },
    mockProfileWebRtcService: {
        init: vi.fn().mockResolvedValue(undefined),
    },
    mockLog: {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    },
    mockNotifier: {
        notifyListeners: vi.fn(),
        types: {
            ACTIVE_PROFILE_CHANGED: 'event.active.profile.changed',
            PROFILE_SWITCH_IN_PROGRESS: 'event.profile.switch.in.progress',
        },
    },
}));

vi.mock('../../../src/background/profiles/index', () => ({
    profilesService: mockProfilesService,
}));

vi.mock('../../../src/background/dns', () => ({
    dns: mockDns,
}));

vi.mock('../../../src/background/exclusions', () => ({
    exclusions: mockExclusions,
}));

vi.mock('../../../src/background/endpoints/locationsService', () => ({
    locationsService: mockLocationsService,
}));

vi.mock('../../../src/background/WebRtcService', () => ({
    profileWebRtcService: mockProfileWebRtcService,
}));

vi.mock('../../../src/common/logger', () => ({
    log: mockLog,
}));

vi.mock('../../../src/common/notifier', () => ({
    notifier: mockNotifier,
}));

// Import AFTER mocks are defined
// eslint-disable-next-line import/first
import { ProfileManager } from '../../../src/background/profiles/profileManager';

describe('ProfileManager.switchProfile', () => {
    const CUSTOM_PROFILE_ID = 'custom-1';
    const CUSTOM_PROFILE_ID_2 = 'custom-2';

    beforeEach(() => {
        vi.clearAllMocks();
        mockProfilesService.getActiveProfileId.mockReturnValue(DEFAULT_PROFILE_ID);
    });

    it('should be a no-op when switching to the already active profile', async () => {
        await ProfileManager.switchProfile(DEFAULT_PROFILE_ID);

        expect(mockProfilesService.setActiveProfile).not.toHaveBeenCalled();
        expect(mockDns.applyActiveProfile).not.toHaveBeenCalled();
        expect(mockExclusions.applyActiveProfile).not.toHaveBeenCalled();
        expect(mockProfileWebRtcService.init).not.toHaveBeenCalled();
        expect(mockLocationsService.applyActiveProfile).not.toHaveBeenCalled();
    });

    it('should persist the new active profile ID', async () => {
        await ProfileManager.switchProfile(CUSTOM_PROFILE_ID);

        expect(mockProfilesService.setActiveProfile).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
    });

    it('should re-apply all profile-managed settings', async () => {
        await ProfileManager.switchProfile(CUSTOM_PROFILE_ID);

        expect(mockDns.applyActiveProfile).toHaveBeenCalledOnce();
        expect(mockExclusions.applyActiveProfile).toHaveBeenCalledOnce();
        expect(mockProfileWebRtcService.init).toHaveBeenCalledOnce();
        expect(mockLocationsService.applyActiveProfile).toHaveBeenCalledOnce();
    });

    it('should apply DNS and exclusions before location', async () => {
        const callOrder: string[] = [];
        mockDns.applyActiveProfile.mockImplementation(async () => { callOrder.push('dns'); });
        mockExclusions.applyActiveProfile.mockImplementation(async () => { callOrder.push('exclusions'); });
        mockProfileWebRtcService.init.mockImplementation(async () => { callOrder.push('webrtc'); });
        mockLocationsService.applyActiveProfile.mockImplementation(async () => { callOrder.push('location'); });

        await ProfileManager.switchProfile(CUSTOM_PROFILE_ID);

        const locationIndex = callOrder.indexOf('location');
        const dnsIndex = callOrder.indexOf('dns');
        const exclusionsIndex = callOrder.indexOf('exclusions');

        expect(dnsIndex).toBeLessThan(locationIndex);
        expect(exclusionsIndex).toBeLessThan(locationIndex);
    });

    it('should apply settings before persisting the active profile ID', async () => {
        const callOrder: string[] = [];

        mockDns.applyActiveProfile.mockImplementation(async () => { callOrder.push('apply'); });
        mockProfilesService.setActiveProfile.mockImplementation(async () => { callOrder.push('setActive'); });

        await ProfileManager.switchProfile(CUSTOM_PROFILE_ID);

        expect(callOrder.indexOf('apply')).toBeLessThan(callOrder.indexOf('setActive'));
    });

    it('should pass target profileId to apply methods', async () => {
        await ProfileManager.switchProfile(CUSTOM_PROFILE_ID);

        expect(mockDns.applyActiveProfile).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
        expect(mockExclusions.applyActiveProfile).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
        expect(mockProfileWebRtcService.init).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
        expect(mockLocationsService.applyActiveProfile).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
    });

    it('should not persist active profile on apply failure', async () => {
        const applyError = new Error('DNS apply failed');
        mockDns.applyActiveProfile.mockRejectedValueOnce(applyError);

        await expect(ProfileManager.switchProfile(CUSTOM_PROFILE_ID)).rejects.toThrow(applyError);

        // setActiveProfile should never be called since apply failed
        expect(mockProfilesService.setActiveProfile).not.toHaveBeenCalled();
    });

    it('should rollback session state to current profile on apply failure', async () => {
        mockExclusions.applyActiveProfile.mockRejectedValueOnce(new Error('exclusions failed'));

        await expect(ProfileManager.switchProfile(CUSTOM_PROFILE_ID)).rejects.toThrow('exclusions failed');

        // First apply targets new profile, rollback targets current profile
        expect(mockDns.applyActiveProfile).toHaveBeenCalledTimes(2);
        expect(mockDns.applyActiveProfile).toHaveBeenNthCalledWith(1, CUSTOM_PROFILE_ID);
        expect(mockDns.applyActiveProfile).toHaveBeenNthCalledWith(2, DEFAULT_PROFILE_ID);
    });

    it('should throw original error when rollback also fails', async () => {
        const originalError = new Error('location apply failed');
        const rollbackError = new Error('rollback dns failed');

        mockLocationsService.applyActiveProfile.mockRejectedValueOnce(originalError);
        // During rollback, dns will fail
        mockDns.applyActiveProfile
            .mockResolvedValueOnce(undefined) // first apply: dns succeeds
            .mockRejectedValueOnce(rollbackError); // rollback apply: dns fails

        await expect(ProfileManager.switchProfile(CUSTOM_PROFILE_ID)).rejects.toThrow(originalError);

        // setActiveProfile should never be called since apply failed
        expect(mockProfilesService.setActiveProfile).not.toHaveBeenCalled();

        // Both errors should be logged
        expect(mockLog.error).toHaveBeenCalledWith(
            expect.stringContaining('Failed to apply settings'),
            originalError,
        );
        expect(mockLog.error).toHaveBeenCalledWith(
            expect.stringContaining('Rollback to profile'),
            rollbackError,
        );
    });

    it('should serialize concurrent switch calls', async () => {
        let resolveFirst!: () => void;
        const firstBlocks = new Promise<void>((resolve) => {
            resolveFirst = resolve;
        });

        mockLocationsService.applyActiveProfile
            .mockImplementationOnce(async () => {
                await firstBlocks;
            });

        const first = ProfileManager.switchProfile(CUSTOM_PROFILE_ID);
        // Give the first call time to start
        await Promise.resolve();
        const second = ProfileManager.switchProfile(CUSTOM_PROFILE_ID_2);

        resolveFirst();
        await first;
        await second;

        // Both switches execute sequentially
        expect(mockProfilesService.setActiveProfile).toHaveBeenCalledTimes(2);
        expect(mockProfilesService.setActiveProfile).toHaveBeenNthCalledWith(1, CUSTOM_PROFILE_ID);
        expect(mockProfilesService.setActiveProfile).toHaveBeenNthCalledWith(2, CUSTOM_PROFILE_ID_2);
    });

    it('should allow next switch to proceed after a failed switch', async () => {
        mockDns.applyActiveProfile.mockRejectedValueOnce(new Error('dns failed'));

        // First switch fails
        await expect(ProfileManager.switchProfile(CUSTOM_PROFILE_ID)).rejects.toThrow('dns failed');

        vi.clearAllMocks();
        mockProfilesService.getActiveProfileId.mockReturnValue(DEFAULT_PROFILE_ID);

        // Second switch should still work
        await ProfileManager.switchProfile(CUSTOM_PROFILE_ID);

        expect(mockProfilesService.setActiveProfile).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
        expect(mockDns.applyActiveProfile).toHaveBeenCalledOnce();
    });

    it('should clear pending tasks on error and emit rollback event', async () => {
        let resolveFirst!: () => void;
        const firstBlocks = new Promise<void>((resolve) => {
            resolveFirst = resolve;
        });

        mockLocationsService.applyActiveProfile
            .mockImplementationOnce(async () => {
                await firstBlocks;
                throw new Error('location failed');
            });

        const first = ProfileManager.switchProfile(CUSTOM_PROFILE_ID);
        await Promise.resolve();
        const second = ProfileManager.switchProfile(CUSTOM_PROFILE_ID_2);

        resolveFirst();
        await expect(first).rejects.toThrow('location failed');
        // Second task was cleared by queue.clear() during rollback — rejects with CancelledError
        await expect(second).rejects.toThrow(CancelledError);

        // Only first switch attempted apply, second was cancelled
        expect(mockProfilesService.setActiveProfile).not.toHaveBeenCalled();

        // Rollback emitted ACTIVE_PROFILE_CHANGED with the original profile id
        expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
            mockNotifier.types.ACTIVE_PROFILE_CHANGED,
            { profileId: DEFAULT_PROFILE_ID, success: false },
        );
    });

    it('should fire PROFILE_SWITCH_IN_PROGRESS when task starts', async () => {
        await ProfileManager.switchProfile(CUSTOM_PROFILE_ID);

        expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
            mockNotifier.types.PROFILE_SWITCH_IN_PROGRESS,
            CUSTOM_PROFILE_ID,
        );
    });

    it('should fire ACTIVE_PROFILE_CHANGED with target id on success', async () => {
        await ProfileManager.switchProfile(CUSTOM_PROFILE_ID);

        expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
            mockNotifier.types.ACTIVE_PROFILE_CHANGED,
            { profileId: CUSTOM_PROFILE_ID, success: true },
        );
    });

    it('should fire ACTIVE_PROFILE_CHANGED with rollback id on error', async () => {
        mockDns.applyActiveProfile.mockRejectedValueOnce(new Error('dns failed'));

        await expect(ProfileManager.switchProfile(CUSTOM_PROFILE_ID)).rejects.toThrow('dns failed');

        expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
            mockNotifier.types.ACTIVE_PROFILE_CHANGED,
            { profileId: DEFAULT_PROFILE_ID, success: false },
        );
    });

    // ---------------------------------------------------------------
    // Rapid-click scenarios — documents the concurrent switch contract:
    //
    // Switches are serialized in FIFO order. Only the last task in the
    // queue emits ACTIVE_PROFILE_CHANGED with success:true. If the last
    // task fails, it rolls back to the profile persisted by the previous
    // (already completed) task and emits success:false. Intermediate
    // success events are suppressed.
    // ---------------------------------------------------------------

    describe('rapid switch (concurrent switch contract)', () => {
        /**
         * Helper: make `getActiveProfileId` and `setActiveProfile`
         * track the active profile in a local variable so the rollback
         * target updates as tasks persist their results.
         */
        function trackActiveProfile(): { getActiveId: () => string } {
            let activeId = DEFAULT_PROFILE_ID;
            mockProfilesService.getActiveProfileId.mockImplementation(() => activeId);
            mockProfilesService.setActiveProfile.mockImplementation(async (id: string) => {
                activeId = id;
            });
            return { getActiveId: () => activeId };
        }

        it('B and C both succeed — only C emits success event', async () => {
            const { getActiveId } = trackActiveProfile();

            let resolveB!: () => void;
            const bBlocks = new Promise<void>((resolve) => {
                resolveB = resolve;
            });

            mockLocationsService.applyActiveProfile
                .mockImplementationOnce(() => bBlocks); // B: delayed success
            // C: default mock (resolves)

            const switchB = ProfileManager.switchProfile(CUSTOM_PROFILE_ID);
            await Promise.resolve();
            const switchC = ProfileManager.switchProfile(CUSTOM_PROFILE_ID_2);

            resolveB();
            await switchB;
            await switchC;

            // C was persisted last
            expect(getActiveId()).toBe(CUSTOM_PROFILE_ID_2);

            // Success event emitted only for C (the last task)
            expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
                mockNotifier.types.ACTIVE_PROFILE_CHANGED,
                { profileId: CUSTOM_PROFILE_ID_2, success: true },
            );

            // B's success was suppressed — it was not the last task
            expect(mockNotifier.notifyListeners).not.toHaveBeenCalledWith(
                mockNotifier.types.ACTIVE_PROFILE_CHANGED,
                expect.objectContaining({ profileId: CUSTOM_PROFILE_ID, success: true }),
            );
        });

        it('B succeeds then C fails — rolls back to B, no success event for B', async () => {
            // active=A, user rapidly clicks B then C.
            // B completes and is persisted. C fails, rolls back to B
            // (the last persisted profile, not the original A).
            const { getActiveId } = trackActiveProfile();

            let resolveB!: () => void;
            const bBlocks = new Promise<void>((resolve) => {
                resolveB = resolve;
            });

            mockLocationsService.applyActiveProfile
                .mockImplementationOnce(() => bBlocks) // B: delayed success
                .mockRejectedValueOnce(new Error('C apply failed')); // C: failure

            const switchB = ProfileManager.switchProfile(CUSTOM_PROFILE_ID);
            await Promise.resolve();
            const switchC = ProfileManager.switchProfile(CUSTOM_PROFILE_ID_2);

            resolveB();
            await switchB;
            await expect(switchC).rejects.toThrow('C apply failed');

            // B was persisted as the active profile
            expect(getActiveId()).toBe(CUSTOM_PROFILE_ID);

            // Complete event trace:
            // 1. PROFILE_SWITCH_IN_PROGRESS(B)  — immediate
            // 2. PROFILE_SWITCH_IN_PROGRESS(C)  — immediate
            // 3. ACTIVE_PROFILE_CHANGED(B, fail) — C's rollback target
            expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
                mockNotifier.types.PROFILE_SWITCH_IN_PROGRESS,
                CUSTOM_PROFILE_ID,
            );
            expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
                mockNotifier.types.PROFILE_SWITCH_IN_PROGRESS,
                CUSTOM_PROFILE_ID_2,
            );
            expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
                mockNotifier.types.ACTIVE_PROFILE_CHANGED,
                { profileId: CUSTOM_PROFILE_ID, success: false },
            );

            // No success event for B — it was not the last task in queue
            expect(mockNotifier.notifyListeners).not.toHaveBeenCalledWith(
                mockNotifier.types.ACTIVE_PROFILE_CHANGED,
                expect.objectContaining({ success: true }),
            );
        });

        it('B fails — C is cancelled, rolls back to A', async () => {
            let resolveB!: () => void;
            const bBlocks = new Promise<void>((resolve) => {
                resolveB = resolve;
            });

            mockLocationsService.applyActiveProfile
                .mockImplementationOnce(async () => {
                    await bBlocks;
                    throw new Error('B apply failed');
                });

            const switchB = ProfileManager.switchProfile(CUSTOM_PROFILE_ID);
            await Promise.resolve();
            const switchC = ProfileManager.switchProfile(CUSTOM_PROFILE_ID_2);

            resolveB();
            await expect(switchB).rejects.toThrow('B apply failed');
            await expect(switchC).rejects.toThrow(CancelledError);

            // Nothing was persisted — active profile is still A
            expect(mockProfilesService.setActiveProfile).not.toHaveBeenCalled();

            // Rollback event points to A (the original profile)
            expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
                mockNotifier.types.ACTIVE_PROFILE_CHANGED,
                { profileId: DEFAULT_PROFILE_ID, success: false },
            );
        });
    });
});

describe('ProfileManager.applyActiveProfileSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should re-apply all services without changing active profile', async () => {
        await ProfileManager.applyActiveProfileSettings('some-profile');

        expect(mockProfilesService.setActiveProfile).not.toHaveBeenCalled();
        expect(mockDns.applyActiveProfile).toHaveBeenCalledWith('some-profile');
        expect(mockExclusions.applyActiveProfile).toHaveBeenCalledWith('some-profile');
        expect(mockProfileWebRtcService.init).toHaveBeenCalledWith('some-profile');
        expect(mockLocationsService.applyActiveProfile).toHaveBeenCalledWith('some-profile');
    });
});

describe('ProfileManager.deleteProfile', () => {
    const CUSTOM_PROFILE_ID = 'custom-1';

    beforeEach(() => {
        vi.clearAllMocks();
        mockProfilesService.getActiveProfileId.mockReturnValue(DEFAULT_PROFILE_ID);
    });

    it('should delete a non-active profile without switching', async () => {
        await ProfileManager.deleteProfile(CUSTOM_PROFILE_ID);

        expect(mockProfilesService.setActiveProfile).not.toHaveBeenCalled();
        expect(mockProfilesService.deleteProfile).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
        expect(mockExclusions.removeProfileData).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
    });

    it('should switch to Default before deleting the active profile', async () => {
        mockProfilesService.getActiveProfileId.mockReturnValue(CUSTOM_PROFILE_ID);

        await ProfileManager.deleteProfile(CUSTOM_PROFILE_ID);

        expect(mockProfilesService.setActiveProfile).toHaveBeenCalledWith(DEFAULT_PROFILE_ID);
        expect(mockProfilesService.deleteProfile).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
        expect(mockExclusions.removeProfileData).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
    });

    it('should emit ACTIVE_PROFILE_CHANGED with DeleteFallback reason when deleting active profile', async () => {
        mockProfilesService.getActiveProfileId.mockReturnValue(CUSTOM_PROFILE_ID);

        await ProfileManager.deleteProfile(CUSTOM_PROFILE_ID);

        expect(mockNotifier.notifyListeners).toHaveBeenCalledWith(
            mockNotifier.types.ACTIVE_PROFILE_CHANGED,
            { profileId: DEFAULT_PROFILE_ID, success: true },
        );
    });

    it('should clean up exclusions data after deleting', async () => {
        const callOrder: string[] = [];
        mockProfilesService.deleteProfile.mockImplementation(async () => { callOrder.push('delete'); });
        mockExclusions.removeProfileData.mockImplementation(() => { callOrder.push('removeData'); });

        await ProfileManager.deleteProfile(CUSTOM_PROFILE_ID);

        expect(callOrder).toEqual(['delete', 'removeData']);
    });

    it('should clean up DNS backup data after deleting', async () => {
        await ProfileManager.deleteProfile(CUSTOM_PROFILE_ID);

        expect(mockDns.removeProfileBackup).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
    });

    it('should propagate deleteProfile error and not clean up caches', async () => {
        const error = new Error('Cannot delete the system default profile');
        mockProfilesService.deleteProfile.mockRejectedValueOnce(error);

        await expect(ProfileManager.deleteProfile(CUSTOM_PROFILE_ID)).rejects.toThrow(error);

        expect(mockExclusions.removeProfileData).not.toHaveBeenCalled();
        expect(mockDns.removeProfileBackup).not.toHaveBeenCalled();
    });

    it('should serialize deleteProfile when switchProfile is in progress', async () => {
        let resolveSwitch!: () => void;
        const switchBlocks = new Promise<void>((resolve) => {
            resolveSwitch = resolve;
        });

        mockProfilesService.getActiveProfileId.mockReturnValue(DEFAULT_PROFILE_ID);

        mockLocationsService.applyActiveProfile
            .mockImplementationOnce(async () => {
                await switchBlocks;
            });

        const switchPromise = ProfileManager.switchProfile(CUSTOM_PROFILE_ID);
        // Give the switch time to start
        await Promise.resolve();
        const deletePromise = ProfileManager.deleteProfile(CUSTOM_PROFILE_ID);

        resolveSwitch();
        await switchPromise;
        await deletePromise;

        // Delete executes after switch completes
        expect(mockProfilesService.deleteProfile).toHaveBeenCalledWith(CUSTOM_PROFILE_ID);
    });
});
