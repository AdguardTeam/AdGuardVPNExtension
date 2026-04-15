import { nanoid } from 'nanoid';
import * as v from 'valibot';

import { log } from '../../common/logger';
import {
    type Profile,
    type ProfileSettings,
    type ProfilesState,
    ProfileKind,
    DEFAULT_PROFILE_SETTINGS,
    DEFAULT_PROFILE_ID,
    MAX_PROFILES_COUNT,
    PROFILES_STATE_DEFAULTS,
    profilesStateScheme,
} from '../schema';
import { browserApi } from '../browserApi';

/**
 * Storage key for profiles data in browser.storage.local.
 */
const PROFILES_STORAGE_KEY = 'profilesState';

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
     * Loads profiles state from persistent storage.
     * Validates the stored data against the schema; falls back to defaults
     * if no data is found or the data is corrupted.
     */
    private async loadState(): Promise<ProfilesState> {
        if (this.cachedState) {
            return this.cachedState;
        }

        const stored = await browserApi.storage.get<unknown>(PROFILES_STORAGE_KEY);

        if (stored) {
            try {
                this.cachedState = v.parse(profilesStateScheme, stored);
            } catch (e) {
                log.error('[vpn.ProfilesService.loadState]: Stored profiles data is invalid, resetting to defaults', e);
                this.cachedState = { ...PROFILES_STATE_DEFAULTS };
                await this.saveState(this.cachedState);
            }
        } else {
            this.cachedState = { ...PROFILES_STATE_DEFAULTS };
        }

        return this.cachedState;
    }

    /**
     * Persists profiles state to browser.storage.local and updates the cache.
     */
    private async saveState(state: ProfilesState): Promise<void> {
        this.cachedState = state;
        await browserApi.storage.set(PROFILES_STORAGE_KEY, state);
    }

    /**
     * Returns the full profiles state.
     */
    public async getState(): Promise<ProfilesState> {
        return this.loadState();
    }

    /**
     * Creates a new profile with the given name and default settings.
     *
     * @param name Display name for the profile.
     * @returns The newly created profile.
     * @throws If the maximum number of profiles has been reached.
     */
    public async createProfile(name: string): Promise<Profile> {
        const state = await this.loadState();

        if (state.profiles.length >= MAX_PROFILES_COUNT) {
            throw new Error(`Cannot create profile: limit of ${MAX_PROFILES_COUNT} reached`);
        }

        const profile: Profile = {
            id: nanoid(),
            kind: ProfileKind.Custom,
            name,
            settings: { ...DEFAULT_PROFILE_SETTINGS },
        };

        await this.saveState({
            ...state,
            profiles: [...state.profiles, profile],
        });
        log.info(`[vpn.ProfilesService.createProfile]: Created profile "${name}" (${profile.id})`);

        return profile;
    }

    /**
     * Renames a profile. The system Default profile cannot be renamed.
     *
     * @param id Profile ID.
     * @param newName New display name.
     * @throws If the profile is not found or is the system default.
     */
    public async renameProfile(id: string, newName: string): Promise<void> {
        const state = await this.loadState();
        const profile = state.profiles.find((p) => p.id === id);

        if (!profile) {
            throw new Error(`Profile not found: ${id}`);
        }

        if (profile.kind === ProfileKind.Default) {
            throw new Error('Cannot rename the system default profile');
        }

        profile.name = newName;

        await this.saveState(state);
        log.info(`[vpn.ProfilesService.renameProfile]: Renamed profile ${id} to "${newName}"`);
    }

    /**
     * Deletes a profile. The system Default profile cannot be deleted.
     * If the active profile is deleted, switches to the Default profile.
     *
     * @param id Profile ID.
     * @throws If the profile is not found or is the system default.
     */
    public async deleteProfile(id: string): Promise<void> {
        const state = await this.loadState();
        const profile = state.profiles.find((p) => p.id === id);

        if (!profile) {
            throw new Error(`Profile not found: ${id}`);
        }

        if (profile.kind === ProfileKind.Default) {
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
    }

    /**
     * Sets the active profile by ID.
     *
     * @param id Profile ID to activate.
     * @throws If the profile is not found.
     */
    public async setActiveProfile(id: string): Promise<void> {
        const state = await this.loadState();

        if (state.activeProfileId === id) {
            return;
        }

        const profile = state.profiles.find((p) => p.id === id);
        if (!profile) {
            throw new Error(`Profile not found: ${id}`);
        }

        await this.saveState({ ...state, activeProfileId: id });
        log.info(`[vpn.ProfilesService.setActiveProfile]: Switched active profile to "${profile.name}" (${id})`);
    }

    /**
     * Updates the settings snapshot of a profile.
     *
     * @param id Profile ID.
     * @param settings New settings snapshot.
     * @throws If the profile is not found.
     */
    public async updateProfileSettings(id: string, settings: ProfileSettings): Promise<void> {
        const state = await this.loadState();
        const profile = state.profiles.find((p) => p.id === id);

        if (!profile) {
            throw new Error(`Profile not found: ${id}`);
        }

        profile.settings = settings;

        await this.saveState(state);
        log.debug(`[vpn.ProfilesService.updateProfileSettings]: Updated settings for profile ${id}`);
    }
}
