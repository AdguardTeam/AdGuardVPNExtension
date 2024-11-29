import { translator } from '../../../../common/translator';

const BUG_REPORT_ERRORS = {
    INVALID_EMAIL: translator.getMessage('options_bug_report_email_invalid'),
    INVALID_MESSAGE: translator.getMessage('options_bug_report_textarea_invalid'),
};

/**
 * Validates email address. Supported formats:
 * - example@example.com
 * - user.name+tag@sub.domain.co.uk
 * - 12345@numbers.org
 * - a@b.c
 *
 * @param value Value to validate
 * @returns Translated error string if invalid, otherwise null.
 */
export const validateEmail = (value: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return isValid ? null : BUG_REPORT_ERRORS.INVALID_EMAIL;
};

/**
 * Validates report message:
 * - It should contain at least one character.
 *
 * @param value Value to validate
 * @returns Translated error string if invalid, otherwise null.
 */
export const validateMessage = (value: string) => {
    const isValid = value && value.length >= 0;
    return isValid ? null : BUG_REPORT_ERRORS.INVALID_MESSAGE;
};
