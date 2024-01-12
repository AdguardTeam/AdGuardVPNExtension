import { differenceInDays, parseISO } from 'date-fns';

/**
 * Returns the number of days between the current date and the renewal date. If the renewal date is in the past,
 * it returns 0.
 *
 * @param curDate - The current date.
 * @param renewalDate - The renewal date in ISO 8601 format (yyyy-MM-dd'T'HH:mm:ssZ).
 * @returns The number of days until the renewal date or 0 if the renewal date is in the past.
 */
export const daysToRenewal = (curDate: Date, renewalDate: string) => {
    const parsed = parseISO(renewalDate);
    const daysToRenewal = differenceInDays(parsed, curDate);
    return daysToRenewal >= 0 ? daysToRenewal : 0;
};
