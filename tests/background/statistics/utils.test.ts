import { dateToKey, keyToDate } from '../../../src/background/statistics/utils';

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
            expect(dateToKey()).toBe('2025-10-01-10');
            expect(dateToKey(new Date('2025-12-31T23:59:59Z'))).toBe('2025-12-31-23');
            expect(dateToKey(new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01-00');
        });
    });

    describe('keyToDate', () => {
        it('should convert date to key', () => {
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
});
