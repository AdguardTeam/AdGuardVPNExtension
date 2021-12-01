import NonRoutableService from '../../../src/background/routability/NonRoutableService';

const storage = (() => {
    const storage = {};
    return {
        set: jest.fn((key, data) => {
            storage[key] = data;
        }),
        get: jest.fn((key) => {
            return storage[key];
        }),
    };
})();

const nonRoutableService = new NonRoutableService(storage);

beforeAll(async () => {
    await nonRoutableService.init();
});

describe('is routable works', () => {
    it('determines correctly localhost', () => {
        expect(nonRoutableService.isUrlRoutable('http://localhost')).toBeFalsy();
        expect(nonRoutableService.isUrlRoutable('http://localhost:8080')).toBeFalsy();
    });

    it('determines correctly ipv4', () => {
        expect(nonRoutableService.isUrlRoutable('http://127.0.0.1/')).toBeFalsy();
    });

    it('works correctly with non ip hostname', () => {
        expect(nonRoutableService.isUrlRoutable('http://example.org')).toBeTruthy();
        expect(nonRoutableService.isUrlRoutable('example.org')).toBeTruthy();
    });

    it('works if where added domains in non routable list', () => {
        nonRoutableService.addHostname('example.org');
        expect(nonRoutableService.isUrlRoutable('http://example.org')).toBeFalsy();
        expect(nonRoutableService.isUrlRoutable('http://yandex.ru')).toBeTruthy();
    });
});
