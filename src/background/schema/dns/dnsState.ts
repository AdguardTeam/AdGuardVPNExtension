import zod from 'zod';
import { dnsServerDataScheme } from './dnsServerData';

export const dnsStateScheme = zod.object({
    selectedDnsServer: zod.string().or(zod.null()),
    customDnsServers: dnsServerDataScheme.array(),
    backupDnsServersData: dnsServerDataScheme.array(),
});

export type DnsState = zod.infer<typeof dnsStateScheme>;

export const DNS_STATE_DEFAULTS: DnsState = {
    customDnsServers: [],
    backupDnsServersData: [],
    selectedDnsServer: null,
};
