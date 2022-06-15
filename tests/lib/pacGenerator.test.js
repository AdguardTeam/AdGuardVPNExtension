import pac from 'pac-resolver';
import { isInNet } from '../../src/background/routability/utils';

import pacGenerator from '../../src/lib/pacGenerator';
import { sleep } from '../../src/lib/helpers';

describe('Pac generator', () => {
    let isInNetMock;
    let options;

    beforeEach(() => {
        isInNetMock = jest.fn(isInNet);
        options = { sandbox: { isInNet: isInNetMock } };
    });

    it('returns direct for all requests if proxy undefined', async () => {
        const pacScript = pacGenerator.generate();
        const FindProxyForUrl = pac(pacScript);
        const result = await FindProxyForUrl('http://example.org', 'example.org');
        expect(result).toBe('DIRECT');
    });

    it('returns proxy for all requests except localhost', async () => {
        const auth = 'username:password@';
        const proxy = 'eff8630ce3fa5be9e9b598e301c1df8f.do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(auth, proxy);
        const FindProxyForUrl = pac(pacScript, options);
        const result = await FindProxyForUrl('https://example.org', 'example.org');
        expect(result).toBe(`HTTPS ${auth}${proxy}`);

        const localhostResult = await FindProxyForUrl('http://localhost/index.html', 'localhost');
        expect(localhostResult).toBe('DIRECT');
    });

    it('returns direct for excluded domains', async () => {
        const auth = 'username:password@';
        const proxy = 'eff8630ce3fa5be9e9b598e301c1df8f.do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(auth, proxy, ['example.org']);
        const FindProxyForUrl = pac(pacScript, options);
        const resultExample = await FindProxyForUrl('https://example.org/index.html', 'example.org');
        expect(resultExample).toBe('DIRECT');

        const resultYandex = await FindProxyForUrl('https://yandex.ru/index.html', 'yandex.ru');
        expect(resultYandex).toBe(`HTTPS ${auth}${proxy}`);

        const localhostResult = await FindProxyForUrl('http://localhost/index.html', 'localhost');
        expect(localhostResult).toBe('DIRECT');
    });

    it('returns direct for inverted excluded domains', async () => {
        const auth = 'username:password@';
        const proxy = 'eff8630ce3fa5be9e9b598e301c1df8f.do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(auth, proxy, ['example.org'], true);
        const FindProxyForUrl = pac(pacScript, options);
        const resultExample = await FindProxyForUrl('https://example.org/index.html', 'example.org');
        expect(resultExample).toBe(`HTTPS ${auth}${proxy}`);

        const resultYandex = await FindProxyForUrl('https://yandex.ru/index.html', 'yandex.ru');
        expect(resultYandex).toBe('DIRECT');

        const localhostResult = await FindProxyForUrl('http://localhost/index.html', 'localhost');
        expect(localhostResult).toBe('DIRECT');
    });

    it('supports shell glob expressions', async () => {
        const auth = 'username:password@';
        const proxy = 'eff8630ce3fa5be9e9b598e301c1df8f.do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(auth, proxy, ['*adguard.com']);
        const FindProxyForUrl = pac(pacScript, options);

        const resultExample = await FindProxyForUrl('https://example.org/index.html', 'example.org');
        expect(resultExample).toBe(`HTTPS ${auth}${proxy}`);

        const resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe('DIRECT');

        const resultBitAdguard = await FindProxyForUrl('https://bit.adguard.com/', 'bit.adguard.com');
        expect(resultBitAdguard).toBe('DIRECT');
    });

    it('supports domains w/ and w/o www', async () => {
        const auth = 'username:password@';
        const proxy = 'do-de-fra1-01.adguard.io:443';
        let pacScript = pacGenerator.generate(auth, proxy, ['adguard.com']);
        let FindProxyForUrl = pac(pacScript, options);

        let resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe('DIRECT');
        let resultWwwAdguard = await FindProxyForUrl('https://www.adguard.com/', 'www.adguard.com');
        expect(resultWwwAdguard).toBe('DIRECT');

        pacScript = pacGenerator.generate(auth, proxy, ['www.adguard.com']);
        FindProxyForUrl = pac(pacScript, options);
        resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe('DIRECT');
        resultWwwAdguard = await FindProxyForUrl('https://www.adguard.com/', 'www.adguard.com');
        expect(resultWwwAdguard).toBe('DIRECT');
    });

    it('supports domains w/ and w/o www when inverted', async () => {
        const auth = 'username:password@';
        const proxy = 'do-de-fra1-01.adguard.io:443';
        let pacScript = pacGenerator.generate(auth, proxy, ['adguard.com'], true);
        let FindProxyForUrl = pac(pacScript, options);

        let resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe(`HTTPS ${auth}${proxy}`);
        let resultWwwAdguard = await FindProxyForUrl('https://www.adguard.com/', 'www.adguard.com');
        expect(resultWwwAdguard).toBe(`HTTPS ${auth}${proxy}`);

        pacScript = pacGenerator.generate(auth, proxy, ['www.adguard.com'], true);
        FindProxyForUrl = pac(pacScript, options);
        resultAdguard = await FindProxyForUrl('https://adguard.com/', 'adguard.com');
        expect(resultAdguard).toBe(`HTTPS ${auth}${proxy}`);
        resultWwwAdguard = await FindProxyForUrl('https://www.adguard.com/', 'www.adguard.com');
        expect(resultWwwAdguard).toBe(`HTTPS ${auth}${proxy}`);
    });

    it('supports default exclusions list', async () => {
        const auth = 'username:password@';
        const proxy = 'do-de-fra1-01.adguard.io:443';
        let pacScript = pacGenerator.generate(auth, proxy, ['example.com'], false, ['adguard.com', 'adguard.io']);
        let FindProxyForUrl = pac(pacScript, options);

        let resultExample = await FindProxyForUrl('https://example.com/foo', 'example.com');
        expect(resultExample).toBe('DIRECT');

        let resultAnotherExample = await FindProxyForUrl('https://another-example.com/foo', 'another-example.com');
        expect(resultAnotherExample).toBe(`HTTPS ${auth}${proxy}`);

        let resultAdguard = await FindProxyForUrl('https://adguard.com/foo', 'adguard.com');
        expect(resultAdguard).toBe('DIRECT');
        let resultAdguardIo = await FindProxyForUrl('https://adguard.io/foo', 'adguard.io');
        expect(resultAdguardIo).toBe('DIRECT');

        pacScript = pacGenerator.generate(auth, proxy, ['example.com'], true, ['*.adguard.com', '*.adguard.io']);
        FindProxyForUrl = pac(pacScript, options);

        resultExample = await FindProxyForUrl('https://example.com/foo', 'example.com');
        expect(resultExample).toBe(`HTTPS ${auth}${proxy}`);

        resultAnotherExample = await FindProxyForUrl('https://another-example.com/foo', 'another-example.com');
        expect(resultAnotherExample).toBe('DIRECT');

        resultAdguard = await FindProxyForUrl('https://prod.adguard.com/foo', 'prod.adguard.com');
        expect(resultAdguard).toBe('DIRECT');

        resultAdguardIo = await FindProxyForUrl('https://dev.adguard.io/foo', 'dev.adguard.io');
        expect(resultAdguardIo).toBe('DIRECT');
    });

    it('pac file life time is reduced to 200ms', async () => {
        const auth = 'username:password@';
        const proxy = 'do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(auth, proxy, [], false, []);
        let FindProxyForUrl = pac(pacScript, options);

        let result = await FindProxyForUrl('https://example.org/foo', 'example.org');
        expect(result).toBe(`HTTPS ${auth}${proxy}`);

        await sleep(300);
        FindProxyForUrl = pac(pacScript, options);
        result = await FindProxyForUrl('https://example.org/foo', 'example.org');
        expect(result).toBe('DIRECT');
    });

    it('supports non routable nets', async () => {
        const auth = 'username:password@';
        const proxy = 'do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(auth, proxy, [], false, [], ['192.168.0.0/16']);
        const FindProxyForUrl = pac(pacScript, options);

        let result = await FindProxyForUrl('http://192.168.1.1', '192.168.1.1');
        expect(result).toBe('DIRECT');

        result = await FindProxyForUrl('http://93.184.216.34', '93.184.216.34');
        expect(result).toBe(`HTTPS ${auth}${proxy}`);
    });

    it('isInNet ignores non IP hosts', async () => {
        const auth = 'username:password@';
        const proxy = 'do-de-fra1-01.adguard.io:443';
        const pacScript = pacGenerator.generate(auth, proxy, [], false, [], ['192.168.0.0/16']);
        const FindProxyForUrl = pac(pacScript, options);

        let result = await FindProxyForUrl('http://192.168.1.1', '192.168.1.1');
        expect(result).toBe('DIRECT');
        expect(isInNetMock).toBeCalledTimes(1);
        expect(isInNetMock).toHaveBeenLastCalledWith('192.168.1.1', '192.168.0.0', '255.255.0.0');

        result = await FindProxyForUrl('http://93.184.216.34', '93.184.216.34');
        expect(result).toBe(`HTTPS ${auth}${proxy}`);
        expect(isInNetMock).toBeCalledTimes(2);
        expect(isInNetMock).toHaveBeenLastCalledWith('93.184.216.34', '192.168.0.0', '255.255.0.0');

        result = await FindProxyForUrl('http://example.org', 'example.org');
        expect(result).toBe(`HTTPS ${auth}${proxy}`);

        // wasn't called again, because it ignores non ip hosts
        expect(isInNetMock).toBeCalledTimes(2);
        expect(isInNetMock).toHaveBeenLastCalledWith('93.184.216.34', '192.168.0.0', '255.255.0.0');
    });
});
