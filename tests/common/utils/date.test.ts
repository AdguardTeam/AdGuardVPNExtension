import { parseISO } from 'date-fns';

import { daysToRenewal } from '../../../src/common/utils/date';

describe('daysToRenewal', () => {
    it('should return the correct number of days until renewal', () => {
        const curDate = parseISO('2023-01-01T00:00:00Z');
        const renewalDate = '2023-01-05T00:00:00Z';

        const result = daysToRenewal(curDate, renewalDate);
        expect(result).toBe(4);
    });

    it('should not return a negative number if the renewal date is in the past', () => {
        const curDate = parseISO('2023-01-10T00:00:00Z');
        const renewalDate = '2023-01-05T00:00:00Z';

        const result = daysToRenewal(curDate, renewalDate);
        expect(result).toBe(0);
    });

    it('should return 0 if the current date is the renewal date', () => {
        const curDate = parseISO('2023-01-05T00:00:00Z');
        const renewalDate = '2023-01-05T23:59:59Z';

        const result = daysToRenewal(curDate, renewalDate);
        expect(result).toBe(0);
    });
});
