import {
    lazyGet,
    formatBytes,
    getLocationWithLowestPing,
} from '../../src/lib/helpers';
import { LocationInterface } from '../../src/background/schema';

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

    const location = getLocationWithLowestPing(locations as LocationInterface[]);

    expect(location).toEqual({
        ping: 60,
        pingBonus: 30,
        countryName: 'United Kingdom',
        cityName: 'London',
    });
});
