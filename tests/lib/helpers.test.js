import {
    lazyGet,
    getHostname,
    getProtocol,
    formatBytes,
    getLocationWithLowestPing,
} from '../../src/lib/helpers';

describe('lazyGet callback', () => {
    const expectedColor = 'blue';
    const cb = jest.fn(() => expectedColor);
    const obj = {
        get color() {
            return lazyGet(obj, 'color', cb);
        },
    };
    it('values should be equal', () => {
        expect(obj.color)
            .toEqual(expectedColor);
    });
    it('should be called when invoked for the first time', () => {
        expect(cb)
            .toHaveBeenCalledTimes(1);
    });
    it('values should be equal', () => {
        expect(obj.color)
            .toEqual(expectedColor);
    });
    it('should NOT be called if invoked for the second time', () => {
        expect(cb)
            .toHaveBeenCalledTimes(1);
    });
    it('should NOT be called if invoked for subsequent times', () => {
        expect(cb)
            .toHaveBeenCalledTimes(1);
    });
});

describe('getHostname', () => {
    it('should return hostname if invoked with URL HTTPS', () => {
        expect(getHostname('https://adguard.com/ru/welcome.html'))
            .toEqual('adguard.com');
    });
    it('should return hostname if invoked with URL HTTP', () => {
        expect(getHostname('http://example.com'))
            .toEqual('example.com');
    });
    it('should return the hostname if it is NOT from URL in HTTP or HTTPS', () => {
        expect(getHostname('chrome://version'))
            .toEqual('version');
    });
    it('should return punycode hostname if invoked with cyrillic URL', () => {
        expect(getHostname('https://мвд.рф'))
            .toEqual('xn--b1aew.xn--p1ai');
    });
    it('should return punycode hostname if invoked with URL with umlaut symbol', () => {
        expect(getHostname('https://zürimech.ch/'))
            .toEqual('xn--zrimech-n2a.ch');
    });
    it('should return the argument if it is incorrect URL - null', () => {
        expect(getHostname(null))
            .toEqual(null);
    });
    it('should return the argument if it is incorrect URL - undefined', () => {
        expect(getHostname(undefined))
            .toEqual(undefined);
    });
});

describe('getProtocol', () => {
    it('should return hostname if invoked with URL HTTPS', () => {
        expect(getProtocol('https://adguard.com/ru/welcome.html'))
            .toEqual('https:');
    });
    it('should return hostname if invoked with URL HTTP', () => {
        expect(getProtocol('http://example.com'))
            .toEqual('http:');
    });
    it('should return the argument if it is incorrect URL - null', () => {
        expect(getProtocol(null))
            .toEqual(null);
    });
    it('should return the argument if it is incorrect URL - undefined', () => {
        expect(getProtocol(undefined))
            .toEqual(undefined);
    });
});

describe('formatBytes', () => {
    expect(formatBytes(0)).toEqual({ value: '0.0', unit: 'KB' });
    expect(formatBytes(10)).toEqual({ value: '0.0', unit: 'KB' });
    expect(formatBytes(-10)).toEqual({ value: '0.0', unit: 'KB' });
    expect(formatBytes(100)).toEqual({ value: '0.1', unit: 'KB' });
    expect(formatBytes(1100)).toEqual({ value: '1.1', unit: 'KB' });
    expect(formatBytes(1110000)).toEqual({ value: '1.1', unit: 'MB' });
    expect(formatBytes(524288000)).toEqual({ value: '500.0', unit: 'MB' });
    expect(formatBytes(1150000000)).toEqual({ value: '1.1', unit: 'GB' });
    expect(formatBytes(1209462790554)).toEqual({ value: '1.1', unit: 'TB' });
    expect(formatBytes(1099511627776)).toEqual({ value: '1.0', unit: 'TB' });
});

describe('getLocationWithLowestPing', () => {
    const locations = [{
        ping: 50,
        pingBonus: 0,
        countryName: 'France',
        cityName: 'Paris',
    }, {
        ping: 60,
        pingBonus: 30,
        countryName: 'United Kingdom',
        cityName: 'London',
    }, {
        ping: 40,
        pingBonus: 0,
        countryName: 'Poland',
        cityName: 'Warsaw',
    }];

    const location = getLocationWithLowestPing(locations);

    expect(location).toEqual({
        ping: 60,
        pingBonus: 30,
        countryName: 'United Kingdom',
        cityName: 'London',
    });
});
