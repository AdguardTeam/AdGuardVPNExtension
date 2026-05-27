import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { type ActiveProfileChangedPayload } from '../../common/profiles';
import { DEFAULT_PROFILE_ID } from '../../common/profiles';
import { dns } from '../dns';
import { exclusions } from '../exclusions';
import { locationsService } from '../endpoints/locationsService';
import { profileWebRtcService } from '../WebRtcService';

import { SerializedQueue } from './serializedQueue';

import { profilesService } from '.';

const queue = new SerializedQueue();
const { decorator: serialized } = queue;

/**
 * Facade for high-level profile operations that coordinate
 * multiple services (DNS, exclusions, WebRTC, locations).
 *
 * All public methods are serialized through a shared queue —
 * concurrent calls execute one at a time in FIFO order.
 *
 * Fires PROFILE_SWITCH_IN_PROGRESS immediately on switch start,
 * and ACTIVE_PROFILE_CHANGED with the definitive profile ID
 * when the last queued operation completes (or on rollback).
 *
 * Concurrent switch semantics ("last wins"):
 * When multiple switches are queued (e.g. user clicks B then C
 * while A is active), each executes sequentially. Only the last
 * successful operation emits ACTIVE_PROFILE_CHANGED with
 * `success: true`. If the last operation fails, it rolls back to
 * the previously persisted profile (not necessarily the original
 * one) and emits `success: false` with that profile's ID.
 * Intermediate successes are persisted but their completion
 * events are suppressed.
 */
export class ProfileManager {
    /**
     * The profile ID currently being applied. Updated on every
     * `switchProfile()` / `deleteProfile()` call. Combined with
     * `queue.isActive()` in the getter to ensure the value is only
     * returned while an operation is actually in progress.
     */
    private static applyingProfileId: string | null = null;

    /**
     * Re-applies all profile-managed settings (DNS, exclusions, WebRTC,
     * location) for the given profile.
     *
     * Order matters: DNS and exclusions are applied before location,
     * because location may trigger a VPN reconnect that relies on the
     * updated DNS and bypass list.
     *
     * @param profileId Profile to apply settings for.
     */
    public static async applyActiveProfileSettings(profileId: string): Promise<void> {
        await dns.applyActiveProfile(profileId);
        await exclusions.applyActiveProfile(profileId);
        await profileWebRtcService.init(profileId);
        await locationsService.applyActiveProfile(profileId);
    }

    /**
     * Applies settings for `targetId` and persists it as active.
     * On failure, clears the queue, emits rollback event, and re-throws.
     * On success, emits the definitive event if this is the last task.
     *
     * WARNING: Do NOT decorate this method with `@serialized` — it is called
     * from within already-serialized methods and would deadlock.
     *
     * @param targetId Profile to switch to.
     * @param rollbackId Profile to revert to on failure.
     * @param reason Why the switch is happening.
     */
    private static async applySwitchWithRollback(
        targetId: string,
        rollbackId: string,
    ): Promise<void> {
        try {
            await ProfileManager.applyActiveProfileSettings(targetId);
        } catch (e) {
            log.error(`[vpn.ProfileManager.applySwitchWithRollback]: Failed to apply settings for profile "${targetId}", reverting`, e);
            queue.clear();
            ProfileManager.applyingProfileId = null;
            const rollbackPayload: ActiveProfileChangedPayload = {
                profileId: rollbackId,
                success: false,
            };
            notifier.notifyListeners(notifier.types.ACTIVE_PROFILE_CHANGED, rollbackPayload);
            try {
                await ProfileManager.applyActiveProfileSettings(rollbackId);
            } catch (rollbackError) {
                log.error(`[vpn.ProfileManager.applySwitchWithRollback]: Rollback to profile "${rollbackId}" also failed`, rollbackError);
            }
            throw e;
        }

        await profilesService.setActiveProfile(targetId);
        ProfileManager.emitResultIfLast(targetId);
    }

    /**
     * Switches the active profile. Fires PROFILE_SWITCH_IN_PROGRESS
     * immediately (before queuing), then applies settings for the target
     * profile and persists it. On success emits the definitive event
     * if this is the last task in queue.
     *
     * @param profileId Target profile ID.
     */
    public static async switchProfile(profileId: string): Promise<void> {
        ProfileManager.applyingProfileId = profileId;
        notifier.notifyListeners(notifier.types.PROFILE_SWITCH_IN_PROGRESS, profileId);
        return ProfileManager.executeSwitchProfile(profileId);
    }

    /**
     * Serialized implementation of profile switching.
     *
     * @param profileId Target profile ID.
     */
    @serialized
    private static async executeSwitchProfile(profileId: string): Promise<void> {
        const currentId = profilesService.getActiveProfileId();

        if (currentId === profileId) {
            ProfileManager.emitResultIfLast(profileId);
            return;
        }

        log.info(`[vpn.ProfileManager.executeSwitchProfile]: Switching from "${currentId}" to "${profileId}"`);
        await ProfileManager.applySwitchWithRollback(profileId, currentId);
    }

    /**
     * Deletes a profile. If the profile being deleted is currently active,
     * switches to the Default profile first (triggering a reconnect),
     * then removes the profile and cleans up cached data.
     *
     * Serialized: concurrent calls queue up and execute one at a time.
     *
     * @param profileId Profile ID to delete.
     */
    @serialized
    public static async deleteProfile(profileId: string): Promise<void> {
        const activeProfileId = profilesService.getActiveProfileId();

        if (activeProfileId === profileId) {
            log.info(`[vpn.ProfileManager.deleteProfile]: Deleting active profile "${profileId}", switching to Default first`);
            ProfileManager.applyingProfileId = DEFAULT_PROFILE_ID;
            notifier.notifyListeners(notifier.types.PROFILE_SWITCH_IN_PROGRESS, DEFAULT_PROFILE_ID);
            await ProfileManager.applySwitchWithRollback(
                DEFAULT_PROFILE_ID,
                profileId,
            );
        }

        await profilesService.deleteProfile(profileId);
        exclusions.removeProfileData(profileId);
        await dns.removeProfileBackup(profileId);
        log.info(`[vpn.ProfileManager.deleteProfile]: Profile "${profileId}" deleted`);
    }

    /**
     * Emits the definitive ACTIVE_PROFILE_CHANGED event if the current
     * task is the last one in the queue.
     *
     * @param profileId The confirmed active profile ID.
     * @param reason Why the profile changed.
     */
    private static emitResultIfLast(profileId: string): void {
        if (queue.isLast()) {
            ProfileManager.applyingProfileId = null;
            const payload: ActiveProfileChangedPayload = {
                profileId,
                success: true,
            };
            notifier.notifyListeners(notifier.types.ACTIVE_PROFILE_CHANGED, payload);
        }
    }

    /**
     * Returns the profile ID currently being applied, or `null` if no
     * profile operation is in progress.
     *
     * Combines the stored target ID with queue activity to avoid
     * returning a stale value after all tasks have completed.
     *
     * @returns Target profile ID, or `null` if no operation is in progress.
     */
    public static getApplyingProfileId(): string | null {
        if (!queue.isActive()) {
            return null;
        }
        return ProfileManager.applyingProfileId;
    }
}
