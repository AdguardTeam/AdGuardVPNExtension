import { dns } from '../../../src/background/dns';

describe('Dns class', () => {
    describe('headersHandler', () => {
        it('append dns header to request', async () => {
            dns.setDns('adguard-dns', true);
            let result = dns.headersHandler({
                requestHeaders: [],
                url: 'http://example.com',
            });
            expect(result).toStrictEqual({
                requestHeaders: [{
                    name: 'X-Adguard-Resolver',
                    value: '176.103.130.130',
                }],
            });

            dns.setDns('adguard-dns-family', true);
            result = dns.headersHandler({
                requestHeaders: [],
                url: 'http://example.com',
            });
            expect(result).toStrictEqual({
                requestHeaders: [{
                    name: 'X-Adguard-Resolver',
                    value: '176.103.130.132',
                }],
            });

            dns.setDns('cloudflare-dns', true);
            result = dns.headersHandler({
                requestHeaders: [],
                url: 'http://example.com',
            });
            expect(result).toStrictEqual({
                requestHeaders: [{
                    name: 'X-Adguard-Resolver',
                    value: '1.1.1.1',
                }],
            });
        });
    });

    describe('isProxyRequest', () => {
        it('return true if request sent to proxy', async () => {
            let result = dns.isProxyRequest('http://example.com');
            expect(result).toBe(true);

            result = dns.isProxyRequest('https://sub.example.com/foo');
            expect(result).toBe(true);

            result = dns.isProxyRequest('https://www.example.com/foo');
            expect(result).toBe(true);

            result = dns.isProxyRequest('http://adguard.com');
            expect(result).toBe(false);

            result = dns.isProxyRequest('https://adguard-vpn.com/en/welcome.html');
            expect(result).toBe(false);

            result = dns.isProxyRequest('https://prod.adguard.com/foo');
            expect(result).toBe(false);

            result = dns.isProxyRequest('https://dev.adguard.io/foo');
            expect(result).toBe(false);

            result = dns.isProxyRequest('localhost');
            expect(result).toBe(false);

            result = dns.isProxyRequest('127.0.0.1');
            expect(result).toBe(false);
        });
    });
});
