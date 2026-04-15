import { nanoid } from 'nanoid';
import * as v from 'valibot';

import { log } from '../../common/logger';
import { translator } from '../../common/translator';
import {
    type Profile,
    type ProfileSettings,
    type ProfilesState,
    ProfileKind,
    StorageKey,
    DEFAULT_PROFILE_SETTINGS,
    DEFAULT_PROFILE_ID,
    MAX_PROFILES_COUNT,
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
     * Loads profiles state from persistent storage.
     * Validates the stored data against the schema; falls back to defaults
     * if no data is found or the data is corrupted.
     * Repairs invariants: ensures the default profile exists and
     * activeProfileId points to a valid profile.
     */
    private async loadState(): Promise<ProfilesState> {
        if (this.cachedState) {
            return this.cachedState;
        }

        const stored = await browserApi.storage.get<unknown>(StorageKey.ProfilesState);

        if (stored) {
            try {
                this.cachedState = v.parse(profilesStateScheme, stored);
            } catch (e) {
                log.error('[vpn.ProfilesService.loadState]: Stored profiles data is invalid, resetting to defaults', e);
                this.cachedState = structuredClone(PROFILES_STATE_DEFAULTS);
            }
        } else {
            this.cachedState = structuredClone(PROFILES_STATE_DEFAULTS);
        }

        const repaired = ProfilesService.repairState(this.cachedState);
        this.cachedState = repaired;

        await this.saveState(this.cachedState);

        return this.cachedState;
    }

    /**
     * Checks invariants and returns a repaired copy if any were violated:
     * - system default profile must exist;
     * - activeProfileId must reference an existing profile;
     * - profile count must not exceed MAX_PROFILES_COUNT.
     *
     * @param state Profiles state to check.
     * @returns Repaired state copy.
     */
    private static repairState(state: ProfilesState): ProfilesState {
        let { profiles, activeProfileId } = state;

        const hasDefault = profiles.some(
            (p) => p.id === DEFAULT_PROFILE_ID && p.kind === ProfileKind.Default,
        );

        if (!hasDefault) {
            log.warn('[vpn.ProfilesService.repairState]: Default profile missing, restoring');
            profiles = [
                {
                    id: DEFAULT_PROFILE_ID,
                    kind: ProfileKind.Default,
                    name: '',
                    settings: structuredClone(DEFAULT_PROFILE_SETTINGS),
                },
                ...profiles,
            ];
        }

        const activeExists = profiles.some((p) => p.id === activeProfileId);
        if (!activeExists) {
            log.warn('[vpn.ProfilesService.repairState]: activeProfileId references missing profile, resetting to default');
            activeProfileId = DEFAULT_PROFILE_ID;
        }

        if (profiles.length > MAX_PROFILES_COUNT) {
            log.warn('[vpn.ProfilesService.repairState]: Profile count exceeds limit, trimming');
            const defaultProfile = profiles.find((p) => p.kind === ProfileKind.Default)!;
            const customProfiles = profiles.filter((p) => p.kind !== ProfileKind.Default);
            profiles = [defaultProfile, ...customProfiles.slice(0, MAX_PROFILES_COUNT - 1)];

            if (!profiles.some((p) => p.id === activeProfileId)) {
                activeProfileId = DEFAULT_PROFILE_ID;
            }
        }

        return { activeProfileId, profiles };
    }

    /**
     * Persists profiles state to browser.storage.local and updates the cache.
     */
    private async saveState(state: ProfilesState): Promise<void> {
        this.cachedState = state;
        await browserApi.storage.set(StorageKey.ProfilesState, state);
    }

    /**
     * Returns the full profiles state with localized system profile name.
     */
    public async getState(): Promise<ProfilesState> {
        const state = await this.loadState();

        return {
            ...state,
            profiles: state.profiles.map((p) => (
                p.kind === ProfileKind.Default
                    ? { ...p, name: translator.getMessage('profiles_default_name') }
                    : p
            )),
        };
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
            settings: structuredClone(DEFAULT_PROFILE_SETTINGS),
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
     * Validates the settings against the schema before persisting.
     *
     * @param id Profile ID.
     * @param settings New settings snapshot.
     * @throws If the profile is not found or settings are invalid.
     */
    public async updateProfileSettings(id: string, settings: ProfileSettings): Promise<void> {
        v.parse(profileSettingsScheme, settings);

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
