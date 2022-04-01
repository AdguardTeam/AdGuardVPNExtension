import PermissionsChecker from './PermissionsChecker';
import permissionsError from './permissionsError';
import credentials from '../credentials';

const permissionsChecker = new PermissionsChecker({
    credentials,
    permissionsError,
});

export default permissionsChecker;
