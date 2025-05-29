import { dateToKey, keyToDate, watchChanges } from '../../../src/background/statistics/utils';

beforeAll(() => {
    jest.useFakeTimers('modern').setSystemTime(new Date('2025-10-01T10:25:10Z'));
});

afterAll(() => {
    jest.useRealTimers();
});

describe('Statistics utils', () => {
    describe('dateToKey', () => {
        jest.useFakeTimers('modern').setSystemTime(new Date('2025-10-01T10:25:10Z'));

        it('should convert date to key', () => {
            expect(dateToKey(false)).toBe('2025-10-01');
            expect(dateToKey(false, new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31');
            expect(dateToKey(false, new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01');
        });

        it('should convert date to key with hours', () => {
            expect(dateToKey(true)).toBe('2025-10-01-10');
            expect(dateToKey(true, new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31-23');
            expect(dateToKey(true, new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01-00');
        });
    });

    describe('keyToDate', () => {
        it('should convert key to date', () => {
            expect(keyToDate('2025-10-01')).toEqual(new Date('2025-10-01T00:00:00Z'));
            expect(keyToDate('2025-12-31')).toEqual(new Date('2025-12-31T00:00:00Z'));
            expect(keyToDate('2025-01-01')).toEqual(new Date('2025-01-01T00:00:00Z'));
        });

        it('should convert date to key with hours', () => {
            expect(keyToDate('2025-10-01-10')).toEqual(new Date('2025-10-01T10:00:00Z'));
            expect(keyToDate('2025-12-31-23')).toEqual(new Date('2025-12-31T23:00:00Z'));
            expect(keyToDate('2025-01-01-00')).toEqual(new Date('2025-01-01T00:00:00Z'));
        });

        it('should return null for invalid keys', () => {
            expect(keyToDate('invalid')).toBe(null);
            expect(keyToDate('2025-10-01-10-00')).toBe(null);
            expect(keyToDate('2025-10-test')).toBe(null);
            expect(keyToDate('2025-test-01')).toBe(null);
            expect(keyToDate('test-01-01')).toBe(null);
        });
    });

    describe('watchChanges', () => {
        let callback: jest.Mock;

        beforeEach(() => {
            callback = jest.fn();
        });

        it('should call callback on top-level property set', () => {
            const obj = { a: 1 };
            const proxy = watchChanges(obj, callback);

            proxy.a = 2;

            expect(obj.a).toBe(2);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should call callback on nested property set', () => {
            const obj = { a: { b: 1 } };
            const proxy = watchChanges(obj, callback);

            proxy.a.b = 42;

            expect(obj.a.b).toBe(42);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should not call callback if value is not changed', () => {
            const obj = { a: 5 };
            const proxy = watchChanges(obj, callback);

            proxy.a = 5;

            expect(callback).not.toHaveBeenCalled();
        });

        it('should call callback on property deletion', () => {
            const obj: { a?: number } = { a: 1 };
            const proxy = watchChanges(obj, callback);

            delete proxy.a;

            expect(obj.a).toBeUndefined();
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should proxy deeply nested objects', () => {
            const obj = { a: { b: { c: 10 } } };
            const proxy = watchChanges(obj, callback);

            proxy.a.b.c = 99;

            expect(obj.a.b.c).toBe(99);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should return same proxy instance for same nested object', () => {
            const obj = { nested: { value: 1 } };
            const proxy = watchChanges(obj, callback);

            const nested1 = proxy.nested;
            const nested2 = proxy.nested;

            expect(nested1).toBe(nested2);
        });

        it('should call callback when adding new property', () => {
            const obj: any = {};
            const proxy = watchChanges(obj, callback);

            proxy.newProp = 'hello';

            expect(obj.newProp).toBe('hello');
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });
});
