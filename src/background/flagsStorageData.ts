import zod from 'zod';

import { FLAGS_FIELDS } from '../common/constants';

export const flagsStorageDataScheme = zod.record(zod.string().or(zod.boolean()));

export type FlagsStorageData = zod.infer<typeof flagsStorageDataScheme>;

export const FLAG_STORAGE_DEFAULTS: FlagsStorageData = {
    // onboarding should be displayed for new users and on first run (AG-10009)
    [FLAGS_FIELDS.SHOW_ONBOARDING]: true,
    // upgrade screen should be displayed for non-premium users after onboarding screen
    [FLAGS_FIELDS.SHOW_UPGRADE_SCREEN]: true,
};
