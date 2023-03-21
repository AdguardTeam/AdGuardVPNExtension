import zod from 'zod';
import { dnsServerDataScheme } from './dnsServerData';

export const dnsStateScheme = zod.object({
    selectedDnsServer: zod.string().or(zod.null()),
    customDnsServers: dnsServerDataScheme.array(),
    backupDnsServersData: dnsServerDataScheme.array(),
});
