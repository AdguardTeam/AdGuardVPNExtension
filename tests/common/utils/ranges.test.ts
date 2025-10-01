import {
    vi,
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
} from 'vitest';

import { formatRange, formatSinceDate } from '../../../src/popup/components/Stats/utils';
import { StatisticsRange } from '../../../src/background/statistics/statisticsTypes';

// Mock webextension-polyfill
vi.mock('webextension-polyfill', () => ({
    default: {
        i18n: {
            getUILanguage: vi.fn(),
        },
    },
}));

// eslint-disable-next-line import/first, import/order
import browser from 'webextension-polyfill';

describe('formatRange', () => {
    beforeEach(() => {
        (browser.i18n.getUILanguage as any).mockReturnValue('en-US');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Hours24 range', () => {
        it('should format 24 hours range correctly when crossing month', () => {
            vi.setSystemTime('2025-05-01T12:00:00Z');
            const result = formatRange(StatisticsRange.Hours24);

            expect(result).toEqual({
                start: 'Apr 30',
                end: 'May 01',
            });
        });

        it('should handle same month correctly for 24 hours', () => {
            vi.setSystemTime(new Date('2024-05-02T12:00:00Z'));

            const result = formatRange(StatisticsRange.Hours24);

            expect(result).toEqual({
                start: '01',
                end: 'May 02',
            });
        });
    });

    describe('Days7 range', () => {
        it('should format 7 days range correctly when crossing months', () => {
            vi.setSystemTime(new Date('2024-05-05T12:00:00Z'));
            const result = formatRange(StatisticsRange.Days7);

            expect(result).toEqual({
                start: 'Apr 29',
                end: 'May 05',
            });
        });

        it('should format 7 days range correctly within same month', () => {
            vi.setSystemTime(new Date('2024-05-20T12:00:00Z'));

            const result = formatRange(StatisticsRange.Days7);

            expect(result).toEqual({
                start: '14',
                end: 'May 20',
            });
        });
    });

    describe('Days30 range', () => {
        it('should format 30 days range correctly when crossing months', () => {
            const result = formatRange(StatisticsRange.Days30);

            expect(result).toEqual({
                end: 'May 20',
                start: 'Apr 21',
            });
        });

        it('should format 30 days range correctly within same month', () => {
            vi.setSystemTime(new Date('2024-05-31T12:00:00Z'));

            const result = formatRange(StatisticsRange.Days30);

            expect(result).toEqual({
                start: '02',
                end: 'May 31',
            });
        });
    });
});

describe('formatSinceDate', () => {
    beforeEach(() => {
        (browser.i18n.getUILanguage as any).mockReturnValue('en-US');
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should format date correctly with year', () => {
        const testDate = new Date('2024-09-19T10:30:00Z');

        const result = formatSinceDate(testDate);

        expect(result).toBe('Sep 19, 2024');
    });
});
