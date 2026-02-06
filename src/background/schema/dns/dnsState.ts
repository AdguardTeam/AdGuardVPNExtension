import * as v from 'valibot';

import { dnsServerDataScheme } from './dnsServerData';

export const dnsStateScheme = v.object({
    selectedDnsServer: v.nullable(v.string()),
    customDnsServers: v.array(dnsServerDataScheme),
    backupDnsServersData: v.array(dnsServerDataScheme),
});

export type DnsState = v.InferOutput<typeof dnsStateScheme>;

export const DNS_STATE_DEFAULTS: DnsState = {
    customDnsServers: [],
    backupDnsServersData: [],
    selectedDnsServer: null,
};
