import { nanoid } from 'nanoid';
import * as v from 'valibot';

import { log } from '../../common/logger';
import {
    DEFAULT_PROFILE_ID,
    MAX_PROFILES_COUNT,
    isDefaultProfileId,
    validateProfileName,
    ProfileNameError,
} from '../../common/profilesConstants';
import {
    type Profile,
    type ProfileInfo,
    type ProfileSettings,
    type ProfilesState,
    StorageKey,
    DEFAULT_PROFILE_SETTINGS,
    PROFILES_STATE_DEFAULTS,
    profilesStateScheme,
    profileSettingsScheme,
} from '../schema';
import { browserApi } from '../browserApi';

/**
 * Manages VPN profiles: CRUD operations, active profile tracking,
 * and business rule enforcement (max count, system profile protection).
 */
export class ProfilesService {
    /**
     * In-memory cache of profiles state.
     */
    private cachedState: ProfilesState | null = null;

    /**
     * Promise chain that serializes write operations
     * to prevent concurrent read-modify-write races.
     */
    private writeQueue: Promise<void> = Promise.resolve();

    /**
     * Enqueues an async callback so that mutations execute one at a time.
     *
     * @param fn Async function that performs a mutation.
     * @returns The value returned by fn.
     */
    private enqueue<T>(fn: () => Promise<T>): Promise<T> {
        const result = this.writeQueue.then(fn);
        this.writeQueue = result.then(
            () => {},
            () => {},
        );
        return result;
    }

    /**
     * Loads profiles state from persistent storage.
     * Validates the stored data against the schema; falls back to defaults
     * if no data is found or the data is corrupted.
     */
    private async loadState(): Promise<ProfilesState> {
        if (this.cachedState) {
            return this.cachedState;
        }

        const stored = await browserApi.storage.get<unknown>(StorageKey.ProfilesState);

        let needsPersist = false;

        if (stored) {
            try {
                this.cachedState = v.parse(profilesStateScheme, stored);
            } catch (e) {
                log.error('[vpn.ProfilesService.loadState]: Stored profiles data is invalid, resetting to defaults', e);
                this.cachedState = structuredClone(PROFILES_STATE_DEFAULTS);
                needsPersist = true;
            }
        } else {
            this.cachedState = structuredClone(PROFILES_STATE_DEFAULTS);
            needsPersist = true;
        }

        if (needsPersist) {
            await this.saveState(this.cachedState);
        }

        return this.cachedState;
    }

    /**
     * Finds a profile by ID or throws if not found.
     *
     * @param state Current profiles state.
     * @param id Profile ID to look up.
     * @returns The matching profile.
     * @throws If no profile with the given ID exists.
     */
    private static getProfileById(state: ProfilesState, id: string): Profile {
        const profile = state.profiles.find((p) => p.id === id);
        if (!profile) {
            throw new Error(`Profile not found: ${id}`);
        }
        return profile;
    }

    /**
     * Persists profiles state to browser.storage.local and updates the cache.
     */
    private async saveState(state: ProfilesState): Promise<void> {
        await browserApi.storage.set(StorageKey.ProfilesState, state);
        this.cachedState = state;
    }

    /**
     * Returns a deep copy of the full profiles state.
     * The clone prevents external code from mutating the in-memory cache.
     */
    public async getState(): Promise<ProfilesState> {
        const state = await this.loadState();
        return structuredClone(state);
    }

    /**
     * Returns lightweight profile descriptors (id + name only)
     * and the active profile ID.
     */
    public async getProfileInfoList(): Promise<{ profiles: ProfileInfo[]; activeProfileId: string }> {
        const state = await this.loadState();
        const profiles = state.profiles.map(({ id, name }) => ({ id, name }));

        return {
            profiles,
            activeProfileId: state.activeProfileId,
        };
    }

    /**
     * Creates a new profile with the given name and default settings.
     *
     * @param name Display name for the profile.
     * @returns The newly created profile.
     * @throws If the name is invalid or the maximum number of profiles has been reached.
     */
    public createProfile(name: string): Promise<Profile> {
        return this.enqueue(async () => {
            const trimmedName = name.trim();
            const nameValidation = validateProfileName(trimmedName);
            if (nameValidation !== ProfileNameError.Ok) {
                throw new Error(nameValidation);
            }

            const state = await this.loadState();

            if (state.profiles.length >= MAX_PROFILES_COUNT) {
                throw new Error(`Cannot create profile: limit of ${MAX_PROFILES_COUNT} reached`);
            }

            const profile: Profile = {
                id: nanoid(),
                name: trimmedName,
                settings: structuredClone(DEFAULT_PROFILE_SETTINGS),
            };

            await this.saveState({
                ...state,
                profiles: [...state.profiles, profile],
            });
            log.info(`[vpn.ProfilesService.createProfile]: Created profile "${trimmedName}" (${profile.id})`);

            return profile;
        });
    }

    /**
     * Renames a profile. The system Default profile cannot be renamed.
     *
     * @param id Profile ID.
     * @param newName New display name.
     * @throws If the profile is not found, is the system default, or the name is invalid.
     */
    public renameProfile(id: string, newName: string): Promise<void> {
        return this.enqueue(async () => {
            const trimmedName = newName.trim();
            const nameValidation = validateProfileName(trimmedName);
            if (nameValidation !== ProfileNameError.Ok) {
                throw new Error(nameValidation);
            }

            const state = await this.loadState();
            const profile = ProfilesService.getProfileById(state, id);

            if (isDefaultProfileId(profile.id)) {
                throw new Error('Cannot rename the system default profile');
            }

            const updatedProfiles = state.profiles.map((p) => (
                p.id === id ? { ...p, name: trimmedName } : p
            ));

            await this.saveState({ ...state, profiles: updatedProfiles });
            log.info(`[vpn.ProfilesService.renameProfile]: Renamed profile ${id} to "${trimmedName}"`);
        });
    }

    /**
     * Deletes a profile. The system Default profile cannot be deleted.
     * If the active profile is deleted, switches to the Default profile.
     *
     * @param id Profile ID.
     * @throws If the profile is not found or is the system default.
     */
    public deleteProfile(id: string): Promise<void> {
        return this.enqueue(async () => {
            const state = await this.loadState();
            const profile = ProfilesService.getProfileById(state, id);

            if (isDefaultProfileId(profile.id)) {
                throw new Error('Cannot delete the system default profile');
            }

            const newProfiles = state.profiles.filter((p) => p.id !== id);

            const newActiveId = state.activeProfileId === id
                ? DEFAULT_PROFILE_ID
                : state.activeProfileId;

            await this.saveState({
                activeProfileId: newActiveId,
                profiles: newProfiles,
            });

            log.info(`[vpn.ProfilesService.deleteProfile]: Deleted profile ${id}`);
        });
    }

    /**
     * Sets the active profile by ID.
     *
     * @param id Profile ID to activate.
     * @throws If the profile is not found.
     */
    public setActiveProfile(id: string): Promise<void> {
        return this.enqueue(async () => {
            const state = await this.loadState();

            if (state.activeProfileId === id) {
                return;
            }

            ProfilesService.getProfileById(state, id);

            await this.saveState({ ...state, activeProfileId: id });
            log.info(`[vpn.ProfilesService.setActiveProfile]: Switched active profile to ${id}`);
        });
    }

    /**
     * Returns the settings snapshot for the currently active profile.
     *
     * @returns A deep copy of the active profile settings.
     * @throws If the active profile is not found.
     */
    public async getActiveProfileSettings(): Promise<ProfileSettings> {
        const state = await this.loadState();
        const profile = ProfilesService.getProfileById(state, state.activeProfileId);

        return structuredClone(profile.settings);
    }

    /**
     * Partially updates the settings of a profile by merging only the
     * provided fields into the existing settings snapshot.
     *
     * If the updated profile is the currently active one and an `onApply`
     * callback is provided, it is invoked after persisting so that the
     * caller can apply the side-effect (e.g. toggling browser APIs).
     *
     * @param id Profile ID.
     * @param patch Partial settings to merge.
     * @param onApply Optional callback invoked only when the profile is active.
     * @throws If the profile is not found or the merged settings are invalid.
     */
    public updateProfileSettings(
        id: string,
        patch: Partial<ProfileSettings>,
        onApply?: () => Promise<void>,
    ): Promise<void> {
        return this.enqueue(async () => {
            const state = await this.loadState();
            const profile = ProfilesService.getProfileById(state, id);

            const merged: ProfileSettings = {
                ...profile.settings,
                ...patch,
            };

            v.parse(profileSettingsScheme, merged);

            const updatedProfiles = state.profiles.map((p) => (
                p.id === id ? { ...p, settings: structuredClone(merged) } : p
            ));

            await this.saveState({ ...state, profiles: updatedProfiles });
            log.debug(`[vpn.ProfilesService.updateProfileSettings]: Updated settings for profile ${id}`);

            if (onApply && id === state.activeProfileId) {
                await onApply();
            }
        });
    }
}
