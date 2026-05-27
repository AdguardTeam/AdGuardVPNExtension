import { nanoid } from 'nanoid';
import * as v from 'valibot';

import { log } from '../../common/logger';
import {
    MAX_PROFILES_COUNT,
    isDefaultProfileId,
    validateProfileName,
    ProfileNameValidationResult,
    type ProfileOperationResponse,
    type ProfilesStateStripped,
} from '../../common/profiles';
import {
    type Profile,
    type ProfileInfo,
    type ProfileSettings,
    type ProfilesState,
    DEFAULT_PROFILE_SETTINGS,
    profileSettingsScheme,
} from '../schema';
import { settings } from '../settings';

import { SerializedQueue } from './serializedQueue';

/**
 * Lightweight list of profiles with the active profile ID.
 */
export interface ProfileInfoListData {
    /**
     * All profiles (id + name only).
     */
    profiles: ProfileInfo[];

    /**
     * Currently active profile ID.
     */
    activeProfileId: string;
}

const { decorator: serialized } = new SerializedQueue();

/**
 * Manages VPN profiles: CRUD operations, active profile tracking,
 * and business rule enforcement (max count, system profile protection).
 */
export class ProfilesService {
    /**
     * Returns the current profiles state from settings.
     * Data is already validated and migrated by SettingsService.
     */
    private loadProfilesData(): ProfilesState {
        return settings.getProfilesState();
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
     * Persists profiles state through the versioned settings storage.
     */
    private saveState(state: ProfilesState): void {
        settings.setProfilesState(state);
    }

    /**
     * Returns a deep copy of the full profiles state.
     * The clone prevents external code from mutating the in-memory cache.
     */
    public async getProfilesData(): Promise<ProfilesState> {
        const state = this.loadProfilesData();
        return structuredClone(state);
    }

    /**
     * Returns a deep copy of the profiles state with the `exclusions` field
     * removed from each profile's settings.
     *
     * Exclusions are delivered separately via `profileExclusionsData` to avoid
     * duplicating potentially large lists over the message channel.
     *
     * @returns Profiles state with exclusions stripped.
     */
    public async getProfilesDataStripped(): Promise<ProfilesStateStripped> {
        const { activeProfileId, profiles } = this.loadProfilesData();
        return {
            activeProfileId,
            profiles: profiles.map(({ id, name, settings }) => {
                const { exclusions, ...settingsWithoutExclusions } = settings;

                return { id, name, settings: settingsWithoutExclusions };
            }),
        };
    }

    /**
     * Returns lightweight profile descriptors (id + name only)
     * and the active profile ID.
     *
     * Used by UI components that only need to display the profile list.
     * Other per-profile settings (WebRTC, DNS, etc.) are transformed
     * and delivered through their respective services.
     *
     * @returns Profiles list with active profile ID.
     */
    public async getProfileInfoList(): Promise<ProfileInfoListData> {
        const state = this.loadProfilesData();
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
     * @returns Operation result with validation code and profile ID on success.
     * @throws If the maximum number of profiles has been reached.
     */
    @serialized
    public async createProfile(name: string): Promise<ProfileOperationResponse> {
        const state = this.loadProfilesData();

        const result = validateProfileName(name, state.profiles);
        if (result !== ProfileNameValidationResult.Ok) {
            return {
                result,
            };
        }
        const trimmedName = name.trim();

        if (state.profiles.length >= MAX_PROFILES_COUNT) {
            throw new Error(`Cannot create profile: limit of ${MAX_PROFILES_COUNT} reached`);
        }

        const settings = structuredClone(DEFAULT_PROFILE_SETTINGS);

        // Inherit the active profile's selected location so every new
        // profile starts with a concrete location value.
        const activeProfile = state.profiles.find((p) => p.id === state.activeProfileId);
        if (activeProfile?.settings.selectedLocation) {
            settings.selectedLocation = structuredClone(activeProfile.settings.selectedLocation);
        }

        const profile: Profile = {
            id: nanoid(),
            name: trimmedName,
            settings,
        };

        this.saveState({
            ...state,
            profiles: [...state.profiles, profile],
        });
        log.info(`[vpn.ProfilesService.createProfile]: Created profile "${trimmedName}" (${profile.id})`);

        return {
            result: ProfileNameValidationResult.Ok,
            profileId: profile.id,
        };
    }

    /**
     * Renames a profile. The system Default profile cannot be renamed.
     *
     * @param id Profile ID.
     * @param newName New display name.
     * @throws If the profile is not found or is the system default.
     */
    @serialized
    public async renameProfile(id: string, newName: string): Promise<ProfileOperationResponse> {
        if (isDefaultProfileId(id)) {
            throw new Error('Cannot rename the system default profile');
        }
        const state = this.loadProfilesData();
        ProfilesService.getProfileById(state, id);

        const nameValidation = validateProfileName(newName, state.profiles, id);
        if (nameValidation !== ProfileNameValidationResult.Ok) {
            return { result: nameValidation };
        }
        const trimmedName = newName.trim();

        const updatedProfiles = state.profiles.map((p) => (
            p.id === id ? { ...p, name: trimmedName } : p
        ));

        this.saveState({ ...state, profiles: updatedProfiles });
        log.info(`[vpn.ProfilesService.renameProfile]: Renamed profile ${id} to "${trimmedName}"`);

        return {
            result: ProfileNameValidationResult.Ok,
            profileId: id,
        };
    }

    /**
     * Deletes a profile. The system Default profile cannot be deleted.
     *
     * The caller ({@link ProfileManager}) is responsible for switching
     * the active profile to Default before calling this method.
     *
     * @param id Profile ID.
     * @throws If the profile is not found or is the system default.
     */
    @serialized
    public async deleteProfile(id: string): Promise<void> {
        if (isDefaultProfileId(id)) {
            throw new Error('Cannot delete the system default profile');
        }

        const state = this.loadProfilesData();
        ProfilesService.getProfileById(state, id);

        const newProfiles = state.profiles.filter((p) => p.id !== id);

        this.saveState({
            activeProfileId: state.activeProfileId,
            profiles: newProfiles,
        });

        log.info(`[vpn.ProfilesService.deleteProfile]: Deleted profile ${id}`);
    }

    /**
     * Sets the active profile by ID.
     *
     * @param id Profile ID to activate.
     * @throws If the profile is not found.
     */
    @serialized
    public async setActiveProfile(id: string): Promise<void> {
        const state = this.loadProfilesData();

        if (state.activeProfileId === id) {
            return;
        }

        ProfilesService.getProfileById(state, id);

        this.saveState({ ...state, activeProfileId: id });
        log.info(`[vpn.ProfilesService.setActiveProfile]: Switched active profile to ${id}`);
    }

    /**
     * Returns the settings snapshot for the currently active profile.
     *
     * @returns A deep copy of the active profile settings.
     * @throws If the active profile is not found.
     */
    public getActiveProfileSettings(): ProfileSettings {
        const state = this.loadProfilesData();
        const profile = ProfilesService.getProfileById(state, state.activeProfileId);

        return structuredClone(profile.settings);
    }

    /**
     * Returns the settings snapshot for a specific profile.
     *
     * @param id Profile ID to get settings for.
     * @returns A deep copy of the profile settings.
     * @throws If the profile is not found.
     */
    public getProfileSettings(id: string): ProfileSettings {
        const state = this.loadProfilesData();
        const profile = ProfilesService.getProfileById(state, id);

        return structuredClone(profile.settings);
    }

    /**
     * Returns the ID of the currently active profile.
     *
     * @returns Active profile ID.
     */
    public getActiveProfileId(): string {
        const state = this.loadProfilesData();

        return state.activeProfileId;
    }

    /**
     * Partially updates the settings of a profile by merging only the
     * provided fields into the existing settings snapshot.
     *
     * If the updated profile is the currently active one and an `onApply`
     * callback is provided, it is invoked before persisting so that if
     * the browser API rejects, storage is not left holding a value that
     * was never applied.
     *
     * @param id Profile ID.
     * @param patch Partial settings to merge.
     * @param onApply Optional callback invoked only when the profile is active.
     * @throws If the profile is not found or the merged settings are invalid.
     */
    @serialized
    public async updateProfileSettings(
        id: string,
        patch: Partial<ProfileSettings>,
        onApply?: () => Promise<void>,
    ): Promise<void> {
        const state = this.loadProfilesData();
        const profile = ProfilesService.getProfileById(state, id);

        const merged: ProfileSettings = {
            ...profile.settings,
            ...patch,
        };

        v.parse(profileSettingsScheme, merged);

        // Apply side-effect first so that if the browser API rejects,
        // storage is not left holding a value that was never applied.
        if (onApply && id === state.activeProfileId) {
            await onApply();
        }

        const updatedProfiles = state.profiles.map((p) => (
            p.id === id ? { ...p, settings: structuredClone(merged) } : p
        ));

        this.saveState({ ...state, profiles: updatedProfiles });
        log.debug(`[vpn.ProfilesService.updateProfileSettings]: Updated settings for profile ${id}`);
    }
}
