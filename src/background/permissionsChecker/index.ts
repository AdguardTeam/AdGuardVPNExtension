import PermissionsChecker from './PermissionsChecker';
import { permissionsError } from './permissionsError';
import { credentials } from '../credentials';

export const permissionsChecker = new PermissionsChecker({
    credentials,
    permissionsError,
});
