import {
    lazyGet,
    getHostname,
    getClosestEndpointByCoordinates,
} from '../src/lib/helpers';

let jest;
const {
    describe, it, expect,
} = global;

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
    it('should return the argument if it is incorrect URL', () => {
        expect(getHostname('/en-US/docs'))
            .toEqual('/en-US/docs');
    });
});

describe('getClosestEndpointByCoordinates', () => {
    const COORDS = [
        { coordinates: [57, 2] },
        { coordinates: [34, 138] },
        { coordinates: [36, 3] },
        { coordinates: [52, 4] },
        { coordinates: [59, 30] },
    ];
    it('should find the closest coordinates correctly', () => {
        expect(getClosestEndpointByCoordinates({ coordinates: [55, 37] }, COORDS))
            .toEqual({ coordinates: [59, 30] });
    });
});
