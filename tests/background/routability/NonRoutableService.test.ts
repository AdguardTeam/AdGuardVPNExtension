import {
    vi,
    describe,
    beforeAll,
    it,
    expect,
} from 'vitest';

import { NonRoutableService } from '../../../src/background/routability/NonRoutableService';
import type { Storage } from '../../../src/background/browserApi/storage';

type TestStorage = {
    [key: string]: unknown;
};

// @ts-ignore - partly implementation
const storage: Storage = (() => {
    const storage: TestStorage = {};
    return {
        set: vi.fn((key, data) => {
            storage[key] = data;
        }),
        get: vi.fn((key) => {
            return storage[key];
        }),
        remove: vi.fn((key) => {
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
