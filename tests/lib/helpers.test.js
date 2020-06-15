import {
    lazyGet,
    getHostname,
    getProtocol,
    getClosestLocationToTarget,
    formatBytes,
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

describe('getClosestEndpointByCoordinates', () => {
    const COORDS = [
        { coordinates: [-79.34, 43.65], city: 'Toronto' },
        { coordinates: [8.68, 50.11], city: 'Frankfurt' },
        { coordinates: [-0.11, 51.5], city: 'London' },
        { coordinates: [77.58, 12.97], city: 'Bangalore' },
        { coordinates: [4.89, 52.37], city: 'Amsterdam' },
        { coordinates: [103.85, 1.29], city: 'Singapore' },
        { coordinates: [-73.93, 40.73], city: 'New York' },
        { coordinates: [-122.43, 37.77], city: 'San Francisco' },
        { coordinates: [37.61, 55.75], city: 'Moscow' },
        { coordinates: [151.2, -33.86], city: 'Sydney' },
        { coordinates: [2.34, 48.86], city: 'Paris' },
        { coordinates: [-84.38, 33.75], city: 'Atlanta' },
        { coordinates: [-97.04, 32.89], city: 'Dallas' },
        { coordinates: [-74.87, 39.83], city: 'New Jersey' },
        { coordinates: [-118.24, 34.05], city: 'Los Angeles' },
        { coordinates: [-80.19, 25.76], city: 'Miami' },
        { coordinates: [-87.62, 41.88], city: 'Chicago' },
        { coordinates: [-122.33, 47.6], city: 'Seattle' },
        { coordinates: [-122.04, 37.37], city: 'Silicon Valley' },
    ];

    it('should find the closest coordinates correctly', () => {
        expect(getClosestLocationToTarget(COORDS, { coordinates: [100, 60] }))
            .toEqual({ coordinates: [37.61, 55.75], city: 'Moscow' });
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
