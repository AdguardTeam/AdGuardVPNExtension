import { dateToKey, keyToDate } from '../../../src/background/statistics/utils';

describe('Statistics utils', () => {
    it('should convert date to key and key to date properly', () => {
        jest.useFakeTimers('modern').setSystemTime(new Date('2025-10-01T10:25:10Z'));

        // date to key - hourly
        expect(dateToKey(true)).toBe('2025-10-01-10');
        expect(dateToKey(true, new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31-23');
        expect(dateToKey(true, new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01-00');

        // date to key - daily
        expect(dateToKey(false)).toBe('2025-10-01');
        expect(dateToKey(false, new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31');
        expect(dateToKey(false, new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01');

        // key to date - hourly
        expect(keyToDate('2025-10-01-10')).toEqual(new Date('2025-10-01T10:00:00Z'));
        expect(keyToDate('2025-12-31-23')).toEqual(new Date('2025-12-31T23:00:00Z'));
        expect(keyToDate('2025-01-01-00')).toEqual(new Date('2025-01-01T00:00:00Z'));

        // key to date - daily
        expect(keyToDate('2025-10-01')).toEqual(new Date('2025-10-01T00:00:00Z'));
        expect(keyToDate('2025-12-31')).toEqual(new Date('2025-12-31T00:00:00Z'));
        expect(keyToDate('2025-01-01')).toEqual(new Date('2025-01-01T00:00:00Z'));

        // key to date - invalid
        expect(keyToDate('invalid')).toBe(null);
        expect(keyToDate('2025-10-01-10-00')).toBe(null);
        expect(keyToDate('2025-10-test')).toBe(null);
        expect(keyToDate('2025-test-01')).toBe(null);
        expect(keyToDate('test-01-01')).toBe(null);

        jest.useRealTimers();
    });
});
