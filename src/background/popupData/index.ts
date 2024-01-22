import { nonRoutable } from '../routability/nonRoutable';
import { permissionsError } from '../permissionsChecker/permissionsError';
import { endpoints } from '../endpoints';
import { permissionsChecker } from '../permissionsChecker';
import { credentials } from '../credentials';

import { PopupData } from './PopupData';

export const popupData = new PopupData({
    endpoints,
    nonRoutable,
    permissionsChecker,
    permissionsError,
    credentials,
});
