import * as v from 'valibot';

import { dnsServerDataScheme } from './dnsServerData';

/**
 * Valibot schema for per-profile DNS state.
 */
export const dnsStateScheme = v.object({
    selectedDnsServer: v.nullable(v.string()),
    customDnsServers: v.array(dnsServerDataScheme),
    backupDnsServersData: v.record(v.string(), v.array(dnsServerDataScheme)),
});

/**
 * Per-profile DNS state inferred from {@link dnsStateScheme}.
 */
export type DnsState = v.InferOutput<typeof dnsStateScheme>;

/**
 * Default values for per-profile DNS state.
 */
export const DNS_STATE_DEFAULTS: DnsState = {
    customDnsServers: [],
    backupDnsServersData: {},
    selectedDnsServer: null,
};
