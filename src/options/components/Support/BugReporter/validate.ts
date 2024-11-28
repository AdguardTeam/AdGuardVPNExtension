import { translator } from '../../../../common/translator';

const BUG_REPORT_ERRORS = {
    INVALID_EMAIL: translator.getMessage('options_bug_report_email_invalid'),
    INVALID_MESSAGE: translator.getMessage('options_bug_report_textarea_invalid'),
};

export const validateEmail = (value: string) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return isValid ? null : BUG_REPORT_ERRORS.INVALID_EMAIL;
};

export const validateMessage = (value: string) => {
    const isValid = value && value.length >= 0;
    return isValid ? null : BUG_REPORT_ERRORS.INVALID_MESSAGE;
};
