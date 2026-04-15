import * as v from 'valibot';

import { ExclusionsMode } from '../../../common/exclusionsConstants';
import { DEFAULT_DNS_SERVER } from '../../../common/dnsConstants';

import { profileScheme, ProfileKind } from './profile';
import { type ProfileSettings } from './profileSettings';

/**
 * Maximum number of profiles (including the system Default profile).
 */
export const MAX_PROFILES_COUNT = 10;

/**
 * Default settings snapshot used when creating new profiles.
 */
export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
    selectedLocationId: null,
    handleWebRtcEnabled: false,
    selectedDnsServer: DEFAULT_DNS_SERVER.id,
    customDnsServers: [],
    exclusions: {
        [ExclusionsMode.Regular]: [],
        [ExclusionsMode.Selective]: [],
        inverted: false,
    },
};

/**
 * ID of the system default profile.
 * Uses a fixed value so it survives across sessions.
 */
export const DEFAULT_PROFILE_ID = 'default';

/**
 * Valibot schema for the profiles persistent state.
 */
export const profilesStateScheme = v.strictObject({
    /**
     * ID of the currently active profile.
     */
    activeProfileId: v.string(),

    /**
     * All profiles, including the system default.
     */
    profiles: v.array(profileScheme),
});

/**
 * Persistent state of the profiles subsystem.
 */
export type ProfilesState = v.InferOutput<typeof profilesStateScheme>;

/**
 * Default profiles state used on fresh install.
 * The system profile name is empty because the display name
 * is resolved via localization on the UI side.
 */
export const PROFILES_STATE_DEFAULTS: ProfilesState = {
    activeProfileId: DEFAULT_PROFILE_ID,
    profiles: [
        {
            id: DEFAULT_PROFILE_ID,
            kind: ProfileKind.Default,
            name: '',
            settings: DEFAULT_PROFILE_SETTINGS,
        },
    ],
};
