import {
    type Profile,
    type ProfileSettings,
    type ProfilesState,
    type DnsServerData,
    type LocationInterface,
} from '../../background/schema';
import { type GetExclusionsDataResponse } from '../exclusionsConstants';

/**
 * Per-profile exclusions data keyed by profile ID.
 */
export type ProfileExclusionsDataMap = Record<string, GetExclusionsDataResponse>;

/**
 * Per-profile DNS data for a single profile.
 */
export interface ProfileDnsData {
    /**
     * ID of the selected DNS server.
     */
    selectedDnsServer: string;

    /**
     * User-defined custom DNS servers.
     */
    customDnsServers: DnsServerData[];
}

/**
 * Per-profile selected location data for a single profile.
 * Contains the location's identity and display fields, or null for automatic selection.
 */
export type ProfileLocationData = LocationInterface | null;

/**
 * Payload for the ACTIVE_PROFILE_CHANGED notifier event.
 */
export interface ActiveProfileChangedPayload {
    /**
     * The definitive active profile ID after the operation.
     */
    profileId: string;

    /**
     * Whether the profile switch completed successfully.
     */
    success: boolean;
}

/**
 * Profile settings without the `exclusions` field — sent to the UI to avoid
 * duplicating potentially large exclusion lists that are already delivered
 * via {@link ProfilesOptionsData.profileExclusionsData}.
 */
export type ProfileSettingsStripped = Omit<ProfileSettings, 'exclusions'>;

/**
 * Profile without the `exclusions` field in its settings.
 */
export type ProfileStripped = Omit<Profile, 'settings'> & {
    settings: ProfileSettingsStripped,
};

/**
 * Profiles state without the `exclusions` field in each profile's settings.
 */
export type ProfilesStateStripped = Omit<ProfilesState, 'profiles'> & {
    profiles: ProfileStripped[],
};

/**
 * Response data from GET_PROFILES_OPTIONS_DATA containing profiles and their settings.
 */
export interface ProfilesOptionsData {
    /**
     * Full profiles state without exclusions
     * Exclusions are omitted to avoid duplicating potentially large lists.
     */
    profilesState: ProfilesStateStripped;

    /**
     * Per-profile exclusions data (preprocessed).
     */
    profileExclusionsData: ProfileExclusionsDataMap;

    /**
     * The profile ID being switched to, or `null` when no switch
     * is in progress.
     */
    switchingProfileId: string | null;
}
