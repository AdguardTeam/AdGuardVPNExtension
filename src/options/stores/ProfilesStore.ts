import punycode from 'punycode';

import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';

import { type Profile } from '../../background/schema/profiles/profile';
import { type GetExclusionsDataResponse } from '../../background/exclusions/ExclusionsService';
import type {
    ExclusionDtoInterface,
    ExclusionsData,
    ExclusionsMode,
    ServiceDto,
} from '../../common/exclusionsConstants';
import type { DnsServerData } from '../../background/schema';
import { DEFAULT_PROFILE_ID, isDefaultProfileId } from '../../common/profilesConstants';
import { messenger } from '../../common/messenger';
import { translator } from '../../common/translator';
import { log } from '../../common/logger';

/**
 * Per-profile exclusions data keyed by profile ID.
 */
export type ProfileExclusionsDataMap = Record<string, GetExclusionsDataResponse>;

/**
 * Per-profile DNS data keyed by profile ID.
 */
export type ProfileDnsDataMap = Record<string, ProfileDnsCacheEntry>;

/**
 * Per-profile location data keyed by profile ID.
 * Value is the selected location ID (or null if not selected).
 */
export type ProfileLocationDataMap = Record<string, string | null>;

/**
 * Per-profile WebRTC data keyed by profile ID.
 */
export type ProfileWebRtcDataMap = Record<string, boolean>;

/**
 * Response data from GET_PROFILES_DATA containing profiles and their settings.
 */
export interface ProfilesOptionsData {
    profiles: Pick<Profile, 'id' | 'name'>[];
    activeProfileId: string;
    profileExclusionsData: ProfileExclusionsDataMap;
    profileDnsData: ProfileDnsDataMap;
    profileLocationData: ProfileLocationDataMap;
    profileWebRtcData: ProfileWebRtcDataMap;
}

/**
 * Per-profile exclusions data cached in the store.
 */
export interface ProfileExclusionsCacheEntry {
    exclusionsTree: ExclusionDtoInterface;
    currentMode: ExclusionsMode;
    services: ServiceDto[];
    isAllExclusionsListsEmpty: boolean;
}

/**
 * Per-profile DNS data cached in the store.
 */
export interface ProfileDnsCacheEntry {
    selectedDnsServer: string;
    customDnsServers: DnsServerData[];
}

/**
 * Recursively converts punycode hostnames to unicode for display.
 *
 * @returns Exclusions tree with unicode hostnames.
 */
const convertExclusionsValuesToUnicode = (exclusionsTree: ExclusionDtoInterface): ExclusionDtoInterface => {
    const unicodeTree = { ...exclusionsTree };
    unicodeTree.hostname = punycode.toUnicode(unicodeTree.hostname);
    unicodeTree.children = unicodeTree.children.map((child) => {
        return convertExclusionsValuesToUnicode(child);
    });
    return unicodeTree;
};

export class ProfilesStore {
    @observable public profiles: Pick<Profile, 'id' | 'name'>[] = [];

    @observable public activeProfileId: string = DEFAULT_PROFILE_ID;

    /**
     * Per-profile exclusions data cache.
     * Key is profile ID, value is the exclusions data for that profile.
     */
    @observable public exclusionsCache = observable.map<string, ProfileExclusionsCacheEntry>();

    /**
     * Per-profile DNS data cache.
     * Key is profile ID, value is the DNS data for that profile.
     */
    @observable public dnsCache = observable.map<string, ProfileDnsCacheEntry>();

    /**
     * Per-profile selected location ID cache.
     * Key is profile ID, value is the selected location ID (or null).
     */
    @observable public locationCache = observable.map<string, string | null>();

    /**
     * Per-profile WebRTC enabled cache.
     * Key is profile ID, value is whether WebRTC protection is enabled.
     */
    @observable public webRtcCache = observable.map<string, boolean>();

    /**
     * Sets profiles and exclusions data received from GET_PROFILES_DATA.
     *
     * @param data Profiles options data.
     */
    @action
    public setProfilesData(data: ProfilesOptionsData): void {
        this.profiles = data.profiles;
        this.activeProfileId = data.activeProfileId;
        this.fillExclusionsCache(data.profileExclusionsData);
        this.fillDnsCache(data.profileDnsData);
        this.fillLocationCache(data.profileLocationData);
        this.fillWebRtcCache(data.profileWebRtcData);
    }

    /**
     * Fetches profiles data from the background and populates the store.
     */
    @action
    public async loadProfilesData(): Promise<void> {
        try {
            const data = await messenger.getProfilesData();
            runInAction(() => {
                this.setProfilesData(data);
            });
        } catch (e) {
            log.error('[vpn.ProfilesStore.loadProfilesData]: ', e.message);
        }
    }

    /**
     * Fills exclusions cache from a per-profile exclusions data map.
     *
     * @param exclusionsDataMap Per-profile exclusions data.
     */
    @action
    private fillExclusionsCache(exclusionsDataMap: ProfileExclusionsDataMap): void {
        Object.entries(exclusionsDataMap).forEach(([id, entry]) => {
            this.exclusionsCache.set(id, {
                exclusionsTree: convertExclusionsValuesToUnicode(entry.exclusionsData.exclusions),
                currentMode: entry.exclusionsData.currentMode,
                services: entry.services,
                isAllExclusionsListsEmpty: entry.isAllExclusionsListsEmpty,
            });
        });
    }

    /**
     * Updates exclusions cache for a specific profile.
     *
     * @param profileId Profile ID to update.
     * @param exclusionsData Exclusions data from the backend.
     * @param services Services data.
     * @param isAllExclusionsListsEmpty Whether all exclusion lists are empty.
     */
    @action
    public updateExclusionsCache(
        profileId: string,
        exclusionsData: ExclusionsData,
        services: ServiceDto[],
        isAllExclusionsListsEmpty: boolean,
    ): void {
        this.exclusionsCache.set(profileId, {
            exclusionsTree: convertExclusionsValuesToUnicode(exclusionsData.exclusions),
            currentMode: exclusionsData.currentMode,
            services,
            isAllExclusionsListsEmpty,
        });
    }

    /**
     * Fills DNS cache from a per-profile DNS data map.
     *
     * @param dnsDataMap Per-profile DNS data.
     */
    @action
    private fillDnsCache(dnsDataMap: ProfileDnsDataMap): void {
        Object.entries(dnsDataMap).forEach(([id, entry]) => {
            this.dnsCache.set(id, entry);
        });
    }

    /**
     * Updates DNS cache for a specific profile.
     *
     * @param profileId Profile ID to update.
     * @param patch Partial DNS data to merge into the cache.
     */
    @action
    public updateDnsCache(
        profileId: string,
        patch: Partial<ProfileDnsCacheEntry>,
    ): void {
        const current = this.dnsCache.get(profileId);
        this.dnsCache.set(profileId, { ...current, ...patch } as ProfileDnsCacheEntry);
    }

    /**
     * Fills location cache from a per-profile location data map.
     *
     * @param locationDataMap Per-profile location data.
     */
    @action
    private fillLocationCache(locationDataMap: ProfileLocationDataMap): void {
        Object.entries(locationDataMap).forEach(([id, selectedLocationId]) => {
            this.locationCache.set(id, selectedLocationId);
        });
    }

    /**
     * Updates location cache for a specific profile.
     *
     * @param profileId Profile ID to update.
     * @param selectedLocationId Selected location ID.
     */
    @action
    public updateLocationCache(
        profileId: string,
        selectedLocationId: string | null,
    ): void {
        this.locationCache.set(profileId, selectedLocationId);
    }

    /**
     * Fills WebRTC cache from a per-profile WebRTC data map.
     *
     * @param webRtcDataMap Per-profile WebRTC data.
     */
    @action
    private fillWebRtcCache(webRtcDataMap: ProfileWebRtcDataMap): void {
        Object.entries(webRtcDataMap).forEach(([id, value]) => {
            this.webRtcCache.set(id, value);
        });
    }

    /**
     * Toggles WebRTC protection for a specific profile.
     *
     * @param profileId Profile ID to toggle.
     */
    @action
    public async toggleWebRtc(profileId: string): Promise<void> {
        const current = this.webRtcCache.get(profileId) ?? false;
        const newValue = !current;
        await messenger.setProfileSetting(profileId, { handleWebRtcEnabled: newValue });
        runInAction(() => {
            this.webRtcCache.set(profileId, newValue);
        });
    }

    /**
     * Returns the currently active profile.
     */
    @computed
    public get activeProfile(): Pick<Profile, 'id' | 'name'> | undefined {
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
    public getDisplayName(profile: Pick<Profile, 'id' | 'name'>): string {
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
