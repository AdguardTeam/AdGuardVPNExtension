import * as v from 'valibot';

import { type PersistedExclusions, persistedExclusionsScheme } from '../exclusions';
import { dnsServerDataScheme } from '../dns';

/**
 * Valibot schema for the settings snapshot stored in each profile.
 */
export const profileSettingsScheme = v.strictObject({
    /**
     * ID of the selected VPN location, or `null` for auto-selection.
     */
    selectedLocationId: v.nullable(v.string()),

    /**
     * Whether WebRTC leak protection is enabled.
     */
    handleWebRtcEnabled: v.boolean(),

    /**
     * ID of the selected DNS server, or `null` for the default.
     */
    selectedDnsServer: v.nullable(v.string()),

    /**
     * User-defined custom DNS servers.
     */
    customDnsServers: v.array(dnsServerDataScheme),

    /**
     * Backup of custom DNS servers for undo after removal.
     */
    backupDnsServersData: v.array(dnsServerDataScheme),

    /**
     * Exclusion lists for Regular and Selective modes, including the active mode flag.
     */
    exclusions: persistedExclusionsScheme,
});

/**
 * Settings snapshot stored in each profile.
 */
export type ProfileSettings = v.InferOutput<typeof profileSettingsScheme>;

/**
 * Partial patch for profile settings.
 * Nested object (exclusions) accepts partial values
 * that are deep-merged by {@link ProfilesService.updateProfileSettings}.
 */
export type ProfileSettingsPatch = Omit<Partial<ProfileSettings>, 'exclusions'> & {
    exclusions?: Partial<PersistedExclusions>;
};
