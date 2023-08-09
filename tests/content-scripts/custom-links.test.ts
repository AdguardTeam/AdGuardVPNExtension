import { getSubscriptionParams } from '../../src/content-scripts/custom-dns-links';

describe('getSubscriptionParams', () => {
    it('extracts urls correctly', () => {
        expect(getSubscriptionParams('adguardvpnext:add_dns_server?address=tls://dns.adguard.com&name=AdGuard'))
            .toEqual({ name: 'AdGuard', address: 'tls://dns.adguard.com' });
        expect(getSubscriptionParams('adguardvpnext:add_dns_server?address=tls%3A%2F%2Fdns.adguard.com&name=AdGuard'))
            .toEqual({ name: 'AdGuard', address: 'tls://dns.adguard.com' });

        expect(getSubscriptionParams('adguardvpnext:add_dns_server?address=https://dns.adguard.com/dns-query&name=AdGuard DoH'))
            .toEqual({ name: 'AdGuard DoH', address: 'https://dns.adguard.com/dns-query' });
        expect(getSubscriptionParams('adguardvpnext:add_dns_server?address=https%3A%2F%2Fdns.adguard.com%2Fdns-query&name=AdGuard%20DoH'))
            .toEqual({ name: 'AdGuard DoH', address: 'https://dns.adguard.com/dns-query' });

        expect(getSubscriptionParams('adguardvpnext:add_dns_server?address=quic://dns.adguard.com&name=AdGuard DoQ'))
            .toEqual({ name: 'AdGuard DoQ', address: 'quic://dns.adguard.com' });
        expect(getSubscriptionParams('adguardvpnext:add_dns_server?address=quic%3A%2F%2Fdns.adguard.com&name=AdGuard%20DoQ'))
            .toEqual({ name: 'AdGuard DoQ', address: 'quic://dns.adguard.com' });
    });
});
