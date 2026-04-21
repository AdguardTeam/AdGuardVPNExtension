import { action, computed, observable } from 'mobx';

import { type Profile } from '../../background/schema/profiles/profile';
import { DEFAULT_PROFILE_ID, isDefaultProfile } from '../../common/profilesConstants';
import { messenger } from '../../common/messenger';
import { translator } from '../../common/translator';
import { log } from '../../common/logger';

export class ProfilesStore {
    @observable public profiles: Profile[] = [];

    @observable public activeProfileId: string = DEFAULT_PROFILE_ID;

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
     * Returns the currently active profile.
     */
    @computed
    public get activeProfile(): Profile | undefined {
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
    public getDisplayName(profile: Profile): string {
        if (isDefaultProfile(profile)) {
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
