import punycode from 'punycode';

import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';

import { type ProfileInfo } from '../../background/schema/profiles/profile';
import { type ExclusionDtoInterface, type ExclusionsData, type ServiceDto } from '../../common/exclusionsConstants';
import {
    type ProfileDnsData,
    type ProfileExclusionsDataMap,
    type ProfileLocationData,
    type ProfilesOptionsData,
    type ProfilesStateStripped,
    type ActiveProfileChangedPayload,
    DEFAULT_PROFILE_ID,
    isDefaultProfileId,
    ProfileSwitchTracker,
} from '../../common/profiles';
import { log } from '../../common/logger';
import { type QuickConnectSetting } from '../../common/constants';
import { messenger } from '../../common/messenger';
import { translator } from '../../common/translator';

import { type RootStore } from './RootStore';

/**
 * Per-profile exclusions data cached in the store.
 */
export interface ProfileExclusionsCacheEntry {
    exclusionsTree: ExclusionDtoInterface;
    currentMode: ExclusionsData['currentMode'];
    services: ServiceDto[];
    isAllExclusionsListsEmpty: boolean;
}

/**
 * Recursively converts punycode hostnames to unicode for display.
 *
 * @param exclusionsTree Exclusions tree to convert.
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

/**
 * MobX store for VPN profiles on the options page.
 * Manages the list of profiles, active profile tracking,
 * and display name resolution.
 */
export class ProfilesStore {
    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @observable public profiles: ProfileInfo[] = [];

    /**
     * Encapsulates the profile switch state machine with MobX bindings.
     */
    private switchTracker = new ProfileSwitchTracker(DEFAULT_PROFILE_ID);

    /**
     * Currently active profile ID.
     */
    public get activeProfileId(): string {
        return this.switchTracker.activeProfileId;
    }

    /**
     * Whether a profile switch operation is currently in progress.
     */
    public get isSwitchingProfile(): boolean {
        return this.switchTracker.isSwitching;
    }

    /**
     * Per-profile exclusions data cache.
     * Key is profile ID, value is the exclusions data for that profile.
     */
    @observable public exclusionsCache: Record<string, ProfileExclusionsCacheEntry> = {};

    /**
     * Per-profile WebRTC enabled cache.
     * Key is profile ID, value is whether WebRTC protection is enabled.
     */
    @observable public webRtcCache: Record<string, boolean> = {};

    /**
     * Per-profile DNS settings cache.
     * Key is profile ID, value is the DNS data for that profile.
     */
    @observable public dnsCache: Record<string, ProfileDnsData> = {};

    /**
     * Per-profile selected location data cache.
     * Key is profile ID, value is the selected location data.
     */
    @observable public locationCache: Record<string, ProfileLocationData> = {};

    /**
     * Per-profile quick-connect strategy cache.
     * Key is profile ID, value is the quick-connect setting.
     */
    @observable public quickConnectCache: Record<string, QuickConnectSetting> = {};

    /**
     * Applies profiles options data to the store caches.
     *
     * @param data Profiles options data.
     */
    @action
    public setProfilesData(data: ProfilesOptionsData): void {
        this.profiles = data.profilesState.profiles.map(({ id, name }) => ({ id, name }));
        this.fillExclusionsCache(data.profileExclusionsData);
        this.fillSimpleCachesFromState(data.profilesState);
        this.setInitialSwitchingProfile(data.profilesState.activeProfileId, data.switchingProfileId);
    }

    /**
     * Applies initial profile state from options data, only if no
     * live event has updated it yet.
     *
     * @param activeProfileId Active profile ID from the initial data snapshot.
     * @param switchingProfileId Target profile ID, or `null` if idle.
     */
    @action
    private setInitialSwitchingProfile(activeProfileId: string, switchingProfileId: string | null): void {
        this.switchTracker.applyInitialData(activeProfileId, switchingProfileId);
    }

    /**
     * Fills exclusions cache from a per-profile exclusions data map.
     *
     * @param exclusionsDataMap Per-profile exclusions data.
     */
    @action
    private fillExclusionsCache(exclusionsDataMap: ProfileExclusionsDataMap): void {
        const cache: Record<string, ProfileExclusionsCacheEntry> = {};
        Object.entries(exclusionsDataMap).forEach(([id, entry]) => {
            cache[id] = {
                exclusionsTree: convertExclusionsValuesToUnicode(entry.exclusionsData.exclusions),
                currentMode: entry.exclusionsData.currentMode,
                services: entry.services,
                isAllExclusionsListsEmpty: entry.isAllExclusionsListsEmpty,
            };
        });
        this.exclusionsCache = cache;
    }

    /**
     * Fills the simple per-profile caches (WebRTC, DNS, location, quick-connect)
     * directly from the profiles state, which is the single source of truth
     * for these settings.
     *
     * @param state Full profiles state.
     */
    @action
    private fillSimpleCachesFromState(state: ProfilesStateStripped): void {
        this.webRtcCache = {};
        this.dnsCache = {};
        this.locationCache = {};
        this.quickConnectCache = {};
        state.profiles.forEach((p) => {
            this.webRtcCache[p.id] = p.settings.handleWebRtcEnabled;
            this.dnsCache[p.id] = {
                selectedDnsServer: p.settings.selectedDnsServer,
                customDnsServers: p.settings.customDnsServers,
            };
            this.locationCache[p.id] = p.settings.selectedLocation;
            this.quickConnectCache[p.id] = p.settings.quickConnect;
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
        this.exclusionsCache[profileId] = {
            exclusionsTree: convertExclusionsValuesToUnicode(exclusionsData.exclusions),
            currentMode: exclusionsData.currentMode,
            services,
            isAllExclusionsListsEmpty,
        };
    }

    /**
     * Updates the WebRTC cache for a given profile.
     *
     * @param profileId Profile ID.
     * @param enabled Whether WebRTC protection is enabled.
     */
    @action
    public updateWebRtcCache(profileId: string, enabled: boolean): void {
        this.webRtcCache[profileId] = enabled;
    }

    /**
     * Updates the DNS cache for a given profile.
     *
     * @param profileId Profile ID.
     * @param data DNS data for the profile.
     */
    @action
    public updateDnsCache(profileId: string, data: ProfileDnsData): void {
        this.dnsCache[profileId] = data;
    }

    /**
     * Updates the location cache for a given profile.
     *
     * @param profileId Profile ID.
     * @param data Selected location data for the profile.
     */
    @action
    public updateLocationCache(profileId: string, data: ProfileLocationData): void {
        this.locationCache[profileId] = data;
    }

    /**
     * Updates the quick-connect cache for a given profile.
     *
     * @param profileId Profile ID.
     * @param value Quick-connect strategy for the profile.
     */
    @action
    public async updateQuickConnectCache(profileId: string, value: QuickConnectSetting): Promise<void> {
        const previousValue = this.quickConnectCache[profileId];
        this.quickConnectCache[profileId] = value;
        try {
            await messenger.setProfileQuickConnect(profileId, value);
        } catch (e) {
            runInAction(() => {
                this.quickConnectCache[profileId] = previousValue;
            });
            throw e;
        }
    }

    /**
     * Removes all cached data for a deleted profile to prevent memory leaks.
     * Should be called after the profile is confirmed deleted on the backend.
     *
     * @param profileId Profile ID to remove from caches.
     */
    @action
    public removeProfileCache(profileId: string): void {
        this.profiles = this.profiles.filter((p) => p.id !== profileId);
        delete this.exclusionsCache[profileId];
        delete this.webRtcCache[profileId];
        delete this.dnsCache[profileId];
        delete this.locationCache[profileId];
        delete this.quickConnectCache[profileId];
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
     * Handles the ACTIVE_PROFILE_CHANGED event from the background.
     * Updates the local active profile ID and shows a notification.
     *
     * @param payload Event payload with profile ID and success flag.
     */
    @action
    public handleProfileChanged(payload: ActiveProfileChangedPayload): void {
        this.switchTracker.completeSwitch(payload);

        if (!payload.success) {
            const { notificationsStore } = this.rootStore;
            notificationsStore.notifyError(
                translator.getMessage('profile_apply_error'),
            );
        }
    }

    /**
     * Handles the PROFILE_SWITCH_IN_PROGRESS event from the background.
     * Optimistically sets the active profile and marks switching in progress.
     *
     * @param profileId The target profile ID being switched to.
     */
    @action
    public startSwitchingProfile(profileId: string): void {
        this.switchTracker.startSwitch(profileId);
    }

    /**
     * Sends a profile switch command to the background.
     * The activeProfileId is updated only by ACTIVE_PROFILE_CHANGED event.
     *
     * @param profileId ID of the profile to activate.
     * @throws If the background fails to switch the profile.
     */
    public async setActiveProfile(profileId: string): Promise<void> {
        if (this.activeProfileId === profileId) {
            return;
        }

        try {
            await messenger.switchProfile(profileId);
        } catch (e) {
            log.error('[vpn.ProfilesStore.setActiveProfile]: Failed to switch profile', e);
        }
    }
}
