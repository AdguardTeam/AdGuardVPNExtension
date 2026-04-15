import * as v from 'valibot';

import { persistedExclusionsScheme } from '../exclusions';
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
     * ID of the selected DNS server (e.g. `'default'`, `'adguard-dns'`).
     */
    selectedDnsServer: v.string(),

    /**
     * User-defined custom DNS servers.
     */
    customDnsServers: v.array(dnsServerDataScheme),

    /**
     * Exclusion lists for Regular and Selective modes, including the active mode flag.
     */
    exclusions: persistedExclusionsScheme,
});

/**
 * Settings snapshot stored in each profile.
 */
export type ProfileSettings = v.InferOutput<typeof profileSettingsScheme>;
