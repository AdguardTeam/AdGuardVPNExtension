import zod from 'zod';

export const dnsServerDataScheme = zod.object({
    id: zod.string(),
    title: zod.string(),
    address: zod.string(),
    desc: zod.string().optional(),
});

export type DnsServerData = zod.infer<typeof dnsServerDataScheme>;
