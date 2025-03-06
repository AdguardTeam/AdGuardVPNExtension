import zod from 'zod';

import { TelemetryActionName } from '../../telemetry';

export const dnsServerDataScheme = zod.object({
    id: zod.string(),
    title: zod.string(),
    address: zod.string(),
    desc: zod.string().optional(),
    telemetryActionName: zod.union([
        zod.literal(TelemetryActionName.AdguardDnsClick),
        zod.literal(TelemetryActionName.AdguardNonfilteringDnsClick),
        zod.literal(TelemetryActionName.AdguardFamilyDnsClick),
        zod.literal(TelemetryActionName.GoogleDnsClick),
        zod.literal(TelemetryActionName.CloudflareDnsClick),
        zod.literal(TelemetryActionName.CiscoDnsClick),
        zod.literal(TelemetryActionName.QuadDnsClick),
    ]).optional(),
});

export type DnsServerData = zod.infer<typeof dnsServerDataScheme>;
