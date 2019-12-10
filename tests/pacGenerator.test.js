import pac from 'pac-resolver';
import pacGenerator from '../src/lib/pacGenerator';

describe('Pac generator', () => {
    it('returns direct for all requests if proxy undefined', async () => {
        const pacScript = pacGenerator.generate();
        const FindProxyForUrl = pac(pacScript);
        const result = await FindProxyForUrl('http://example.org', 'example.org');
        expect(result).toBe('DIRECT');
    });

    it('returns proxy for all requests except localhost', async () => {
        const proxy = 'eff8630ce3fa5be9e9b598e301c1df8f.do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(proxy);
        const FindProxyForUrl = pac(pacScript);
        const result = await FindProxyForUrl('https://example.org', 'example.org');
        expect(result).toBe(`HTTPS ${proxy}`);

        const localhostResult = await FindProxyForUrl('http://localhost/index.html', 'localhost');
        expect(localhostResult).toBe('DIRECT');
    });

    it('returns direct for excluded domains', async () => {
        const proxy = 'eff8630ce3fa5be9e9b598e301c1df8f.do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(proxy, ['example.org']);
        const FindProxyForUrl = pac(pacScript);
        const resultExample = await FindProxyForUrl('https://example.org/index.html', 'example.org');
        expect(resultExample).toBe('DIRECT');

        const resultYandex = await FindProxyForUrl('https://yandex.ru/index.html', 'yandex.ru');
        expect(resultYandex).toBe(`HTTPS ${proxy}`);

        const localhostResult = await FindProxyForUrl('http://localhost/index.html', 'localhost');
        expect(localhostResult).toBe('DIRECT');
    });

    it('returns direct for inverted excluded domains', async () => {
        const proxy = 'eff8630ce3fa5be9e9b598e301c1df8f.do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(proxy, ['example.org'], true);
        const FindProxyForUrl = pac(pacScript);
        const resultExample = await FindProxyForUrl('https://example.org/index.html', 'example.org');
        expect(resultExample).toBe(`HTTPS ${proxy}`);

        const resultYandex = await FindProxyForUrl('https://yandex.ru/index.html', 'yandex.ru');
        expect(resultYandex).toBe('DIRECT');

        const localhostResult = await FindProxyForUrl('http://localhost/index.html', 'localhost');
        expect(localhostResult).toBe('DIRECT');
    });

    it('supports shell glob expressions', async () => {
        const proxy = 'eff8630ce3fa5be9e9b598e301c1df8f.do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(proxy, ['*adguard.com']);
        const FindProxyForUrl = pac(pacScript);

        const resultExample = await FindProxyForUrl('https://example.org/index.html', 'example.org');
        expect(resultExample).toBe(`HTTPS ${proxy}`);

        const resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe('DIRECT');

        const resultBitAdguard = await FindProxyForUrl('https://bit.adguard.com/', 'bit.adguard.com');
        expect(resultBitAdguard).toBe('DIRECT');
    });
});
