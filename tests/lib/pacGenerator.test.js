import pac from 'pac-resolver';
import pacGenerator from '../../src/lib/pacGenerator';
import { sleep } from '../../src/lib/helpers';
import { DEFAULT_EXCLUSIONS } from '../../src/background/proxy/proxyConsts';

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

    it('supports domains w/ and w/o www', async () => {
        const proxy = 'do-de-fra1-01.adguard.io:443';
        let pacScript = pacGenerator.generate(proxy, ['adguard.com']);
        let FindProxyForUrl = pac(pacScript);

        let resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe('DIRECT');
        let resultWwwAdguard = await FindProxyForUrl('https://www.adguard.com/', 'www.adguard.com');
        expect(resultWwwAdguard).toBe('DIRECT');

        pacScript = pacGenerator.generate(proxy, ['www.adguard.com']);
        FindProxyForUrl = pac(pacScript);
        resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe('DIRECT');
        resultWwwAdguard = await FindProxyForUrl('https://www.adguard.com/', 'www.adguard.com');
        expect(resultWwwAdguard).toBe('DIRECT');
    });

    it('supports domains w/ and w/o www when inverted', async () => {
        const proxy = 'do-de-fra1-01.adguard.io:443';
        let pacScript = pacGenerator.generate(proxy, ['adguard.com'], true);
        let FindProxyForUrl = pac(pacScript);

        let resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe(`HTTPS ${proxy}`);
        let resultWwwAdguard = await FindProxyForUrl('https://www.adguard.com/', 'www.adguard.com');
        expect(resultWwwAdguard).toBe(`HTTPS ${proxy}`);

        pacScript = pacGenerator.generate(proxy, ['www.adguard.com'], true);
        FindProxyForUrl = pac(pacScript);
        resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe(`HTTPS ${proxy}`);
        resultWwwAdguard = await FindProxyForUrl('https://www.adguard.com/', 'www.adguard.com');
        expect(resultWwwAdguard).toBe(`HTTPS ${proxy}`);
    });

    it('supports default exclusions list', async () => {
        const proxy = 'do-de-fra1-01.adguard.io:443';
        let pacScript = pacGenerator.generate(proxy, ['example.com'], false, ['adguard.com', 'adguard.io']);
        let FindProxyForUrl = pac(pacScript);

        let resultExample = await FindProxyForUrl('https://example.com/foo', 'example.com');
        expect(resultExample).toBe('DIRECT');

        let resultAnotherExample = await FindProxyForUrl('https://another-example.com/foo', 'another-example.com');
        expect(resultAnotherExample).toBe(`HTTPS ${proxy}`);

        let resultAdguard = await FindProxyForUrl('https://adguard.com/foo', 'adguard.com');
        expect(resultAdguard).toBe('DIRECT');
        let resultAdguardIo = await FindProxyForUrl('https://adguard.io/foo', 'adguard.io');
        expect(resultAdguardIo).toBe('DIRECT');

        pacScript = pacGenerator.generate(proxy, ['example.com'], true, ['*.adguard.com', '*.adguard.io']);
        FindProxyForUrl = pac(pacScript);

        resultExample = await FindProxyForUrl('https://example.com/foo', 'example.com');
        expect(resultExample).toBe(`HTTPS ${proxy}`);

        resultAnotherExample = await FindProxyForUrl('https://another-example.com/foo', 'another-example.com');
        expect(resultAnotherExample).toBe('DIRECT');

        resultAdguard = await FindProxyForUrl('https://prod.adguard.com/foo', 'prod.adguard.com');
        expect(resultAdguard).toBe('DIRECT');

        resultAdguardIo = await FindProxyForUrl('https://dev.adguard.io/foo', 'dev.adguard.io');
        expect(resultAdguardIo).toBe('DIRECT');
    });

    it('pac file life time is reduced to 200ms', async () => {
        const proxy = 'do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(proxy, [], false, []);
        let FindProxyForUrl = pac(pacScript);

        let result = await FindProxyForUrl('https://example.org/foo', 'example.org');
        expect(result).toBe(`HTTPS ${proxy}`);

        await sleep(300);
        FindProxyForUrl = pac(pacScript);
        result = await FindProxyForUrl('https://example.org/foo', 'example.org');
        expect(result).toBe('DIRECT');
    });


    it('default exclusions', async () => {
        const proxy = 'do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(proxy, [], false, DEFAULT_EXCLUSIONS);
        const FindProxyForUrl = pac(pacScript);

        let result = await FindProxyForUrl('http://adguard.com/url_path/license.html', 'adguard.com');
        expect(result).toBe('DIRECT');

        result = await FindProxyForUrl('https://adguard.com/url_path/license.html', 'adguard.com');
        expect(result).toBe('DIRECT');

        result = await FindProxyForUrl('https://adguard.com/url_path/wrong.html', 'adguard.com');
        expect(result).toBe(`HTTPS ${proxy}`);

        result = await FindProxyForUrl('http://adguard.com/pg/url_path', 'adguard.com');
        expect(result).toBe('DIRECT');

        result = await FindProxyForUrl('http://auth.adguard.io/some/url_path', 'auth.adguard.io');
        expect(result).toBe('DIRECT');

        result = await FindProxyForUrl('http://adguard.io/some/url_path', 'adguard.io');
        expect(result).toBe(`HTTPS ${proxy}`);

        result = await FindProxyForUrl('http://account.adguard.com/some/url_path', 'account.adguard.com');
        expect(result).toBe('DIRECT');

        result = await FindProxyForUrl('https://account.adguard.com/', 'account.adguard.com');
        expect(result).toBe('DIRECT');

        result = await FindProxyForUrl('https://localhost:3333', 'localhost');
        expect(result).toBe('DIRECT');

        result = await FindProxyForUrl('https://adguard.com/en/license.html?email=me@example.org', 'adguard.com');
        expect(result).toBe('DIRECT');
    });
});
