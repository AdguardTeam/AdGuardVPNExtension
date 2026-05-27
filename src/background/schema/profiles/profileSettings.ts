import * as v from 'valibot';

import { QuickConnectSetting } from '../../../common/constants';
import { persistedExclusionsScheme } from '../exclusions';
import { dnsServerDataScheme } from '../dns';
import { locationScheme } from '../endpoints/location';

/**
 * Valibot schema for the settings snapshot stored in each profile.
 */
export const profileSettingsScheme = v.strictObject({
    /**
     * Full selected VPN location object, or `null` when not yet set.
     */
    selectedLocation: v.nullable(locationScheme),

    /**
     * Quick-connect strategy: use last manually selected location or auto-pick fastest.
     */
    quickConnect: v.enum(QuickConnectSetting),

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
