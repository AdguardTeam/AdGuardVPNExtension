import { action, computed, observable } from 'mobx';

import { type ProfileInfo } from '../../background/schema/profiles/profile';
import { DEFAULT_PROFILE_ID, isDefaultProfileId } from '../../common/profilesConstants';
import { messenger } from '../../common/messenger';
import { translator } from '../../common/translator';
import { log } from '../../common/logger';

/**
 * Per-profile WebRTC data keyed by profile ID.
 */
export type ProfileWebRtcDataMap = Record<string, boolean>;

/**
 * Response data from GET_PROFILES_OPTIONS_DATA containing profiles and their settings.
 */
export interface ProfilesOptionsData {
    /**
     * All profiles (lightweight: id + name only).
     */
    profiles: ProfileInfo[];

    /**
     * Currently active profile ID.
     */
    activeProfileId: string;

    /**
     * Per-profile WebRTC enabled state.
     */
    profileWebRtcData: ProfileWebRtcDataMap;
}

export class ProfilesStore {
    @observable public profiles: ProfileInfo[] = [];

    @observable public activeProfileId: string = DEFAULT_PROFILE_ID;

    /**
     * Per-profile WebRTC enabled cache.
     * Key is profile ID, value is whether WebRTC protection is enabled.
     */
    @observable public webRtcCache = observable.map<string, boolean>();

    /**
     * Fetches profiles data from the background script and updates the store.
     */
    @action
    public async loadProfiles(): Promise<void> {
        try {
            const data = await messenger.getProfilesData();
            this.profiles = data.profiles;
            this.activeProfileId = data.activeProfileId;
        } catch (e) {
            log.error('[vpn.ProfilesStore.loadProfiles]: ', e.message);
        }
    }

    /**
     * Fetches and applies profiles options data including per-profile settings.
     */
    @action
    public async loadProfilesData(): Promise<void> {
        try {
            const data = await messenger.getProfilesOptionsData();
            this.setProfilesData(data);
        } catch (e) {
            log.error('[vpn.ProfilesStore.loadProfilesData]: ', e.message);
        }
    }

    /**
     * Applies profiles options data to the store caches.
     *
     * @param data Profiles options data.
     */
    @action
    public setProfilesData(data: ProfilesOptionsData): void {
        this.profiles = data.profiles;
        this.activeProfileId = data.activeProfileId;
        this.fillWebRtcCache(data.profileWebRtcData);
    }

    /**
     * Fills the per-profile WebRTC cache from a data map.
     *
     * @param webRtcData Map of profile ID to WebRTC enabled state.
     */
    @action
    private fillWebRtcCache(webRtcData: ProfileWebRtcDataMap): void {
        this.webRtcCache.clear();
        Object.entries(webRtcData).forEach(([profileId, enabled]) => {
            this.webRtcCache.set(profileId, enabled);
        });
    }

    /**
     * Updates the WebRTC cache for a given profile.
     *
     * @param profileId Profile ID.
     * @param enabled Whether WebRTC protection is enabled.
     */
    @action
    public updateWebRtcCache(profileId: string, enabled: boolean): void {
        this.webRtcCache.set(profileId, enabled);
    }

    /**
     * Returns the currently active profile.
     */
    @computed
    public get activeProfile(): ProfileInfo | undefined {
        return this.profiles.find((p) => p.id === this.activeProfileId);
    }

    /**
     * Returns true if the given profile is currently active.
     *
     * @param profileId Profile ID to check.
     */
    public isActive(profileId: string): boolean {
        return profileId === this.activeProfileId;
    }

    /**
     * Returns the display name for a profile.
     * Default profile gets a translated name, others use their stored name.
     *
     * @param profile Profile to get the display name for.
     */
    public getDisplayName(profile: ProfileInfo): string {
        if (isDefaultProfileId(profile.id)) {
            return translator.getMessage('settings_profiles_default_name');
        }
        return profile.name;
    }

    /**
     * Returns the display name for the active profile.
     * Used in the sidebar subtitle.
     */
    @computed
    public get activeProfileDisplayName(): string | undefined {
        const profile = this.activeProfile;
        if (!profile) {
            return undefined;
        }

        return this.getDisplayName(profile);
    }

    /**
     * Switches the active profile on the frontend.
     *
     * @param profileId ID of the profile to activate.
     */
    // FIXME: AG-52850 Implement backend logic for profile switching
    //  (send message to background, apply profile settings, reconnect VPN if needed)
    @action
    public setActiveProfile(profileId: string): void {
        this.activeProfileId = profileId;
    }
}
