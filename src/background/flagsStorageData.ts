import { FLAGS_FIELDS } from '../common/constants';

export type FlagsStorageData = Record<string, boolean>;

export const FLAG_STORAGE_DEFAULTS: FlagsStorageData = {
    // newsletter should be displayed for users that do not accepted yet
    [FLAGS_FIELDS.SHOW_NEWSLETTER]: true,
    // onboarding should be displayed for new users and on first run (AG-10009)
    [FLAGS_FIELDS.SHOW_ONBOARDING]: true,
    // upgrade screen should be displayed for non-premium users after onboarding screen
    [FLAGS_FIELDS.SHOW_UPGRADE_SCREEN]: true,
};
