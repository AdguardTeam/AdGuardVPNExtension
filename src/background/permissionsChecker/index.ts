import { credentials } from '../credentials';

import { PermissionsChecker } from './PermissionsChecker';
import { permissionsError } from './permissionsError';

export const permissionsChecker = new PermissionsChecker({
    credentials,
    permissionsError,
});
