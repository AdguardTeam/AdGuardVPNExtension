import * as v from 'valibot';

export const dnsServerDataScheme = v.object({
    id: v.string(),
    title: v.string(),
    address: v.string(),
    desc: v.optional(v.string()),
});

export type DnsServerData = v.InferOutput<typeof dnsServerDataScheme>;
