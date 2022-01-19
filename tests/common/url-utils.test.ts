import { getETld, getHostname, getProtocol } from '../../src/common/url-utils';

describe('getETld', () => {
    it('returns eTld + 1 in the simple cases', () => {
        const eTld = getETld('example.org');
        expect(eTld).toEqual('example.org');
    });

    it('returns eTld + 1 for wildcard', () => {
        const eTld = getETld('*.example.org');
        expect(eTld).toEqual('example.org');
    });

    it('returns eTld + 1 for third level domain', () => {
        const eTld = getETld('test.example.org');
        expect(eTld).toEqual('example.org');
    });

    it('returns ip as is', () => {
        const eTld = getETld('192.168.1.1');
        expect(eTld).toEqual('192.168.1.1');
    });

    describe('returns eTld if hostname consist from eTld only', () => {
        it('returns eTld for common tld', () => {
            const hostname = 'com';
            const eTld = getETld(hostname);
            expect(eTld).toEqual(hostname);
        });

        it('returns eTld for wildcarded common tld', () => {
            const hostname = 'com';
            const eTld = getETld(`*.${hostname}`);
            expect(eTld).toEqual(hostname);
        });

        it('returns eTld for private tld', () => {
            const hostname = 'blogspot.ru';
            const eTld = getETld(hostname);
            expect(eTld).toEqual(hostname);
        });

        it('returns eTld for wildcarded private tld', () => {
            const hostname = 'blogspot.ru';
            const eTld = getETld(`*.${hostname}`);
            expect(eTld).toEqual(hostname);
        });
    });
});

describe('getProtocol', () => {
    it('should return hostname if invoked with URL HTTPS', () => {
        expect(getProtocol('https://adguard.com/ru/welcome.html')).toEqual('https:');
    });

    it('should return hostname if invoked with URL HTTP', () => {
        expect(getProtocol('http://example.com')).toEqual('http:');
    });

    it('should return hostname if invoked with URL HTTP', () => {
        expect(getProtocol('ftp://example.com')).toEqual('ftp:');
    });

    it('should return the argument if it is incorrect URL - null', () => {
        expect(getProtocol(null)).toBeNull();
    });

    it('should return the argument if it is incorrect URL - undefined', () => {
        expect(getProtocol(undefined)).toBeNull();
    });

    it('should return null if invoked with URL without protocol', () => {
        expect(getProtocol('example.org')).toBeNull();
    });

    it('should return null if invoked with cyrillic URL without protocol', () => {
        expect(getProtocol('пример.рф')).toBeNull();
    });
});

describe('getHostname', () => {
    it('should return hostname if invoked with URL HTTPS', () => {
        expect(getHostname('https://adguard.com/ru/welcome.html')).toEqual('adguard.com');
    });
    it('should return hostname if invoked with URL HTTP', () => {
        expect(getHostname('http://example.com')).toEqual('example.com');
    });
    it('should return the hostname if it is NOT from URL in HTTP or HTTPS', () => {
        expect(getHostname('chrome://version')).toEqual('version');
    });
    it('should return punycode hostname if invoked with cyrillic URL', () => {
        expect(getHostname('https://мвд.рф')).toEqual('xn--b1aew.xn--p1ai');
    });
    it('should return punycode hostname if invoked with URL with umlaut symbol', () => {
        expect(getHostname('https://zürimech.ch/')).toEqual('xn--zrimech-n2a.ch');
    });
    it('should return the argument if it is incorrect URL - null', () => {
        expect(getHostname(null)).toEqual(null);
    });
    it('should return the argument if it is incorrect URL - undefined', () => {
        expect(getHostname(undefined)).toBeNull();
    });
    it('should return hostname if invoked with URL without protocol', () => {
        expect(getHostname('test.com')).toEqual('test.com');
        expect(getHostname('test.com/test/')).toEqual('test.com');
    });
    it('should return punycode hostname if invoked with cyrillic URL without protocol', () => {
        expect(getHostname('мвд.рф')).toEqual('xn--b1aew.xn--p1ai');
        expect(getHostname('мвд.рф/тест/')).toEqual('xn--b1aew.xn--p1ai');
    });
    it('should return hostname without WWW', () => {
        expect(getHostname('http://www.example.com')).toEqual('example.com');
        expect(getHostname('www.example.com')).toEqual('example.com');
        expect(getHostname('https://www.example.com')).toEqual('example.com');
        expect(getHostname('http://testwww.com')).toEqual('testwww.com');
        expect(getHostname('testwww.com')).toEqual('testwww.com');
        expect(getHostname('https://www.testwww.com')).toEqual('testwww.com');
    });
    it('handle wildcard', () => {
        expect(getHostname('*.com')).toEqual('*.com');
        expect(getHostname('*.example.com')).toEqual('*.example.com');
        expect(getHostname('*.test.example.com')).toEqual('*.test.example.com');
        expect(getHostname('https://*.com')).toEqual('*.com');
        expect(getHostname('https://*.example.com')).toEqual('*.example.com');
    });
});
