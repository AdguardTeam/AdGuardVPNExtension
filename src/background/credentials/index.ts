import { browserApi } from '../browserApi';
import { permissionsError } from '../permissionsChecker/permissionsError';
import { proxy } from '../proxy';
import { vpnProvider } from '../providers/vpnProvider';
// eslint-disable-next-line import/no-cycle
import auth from '../auth';
import Credentials from './Credentials';

export const credentials = new Credentials({
    browserApi,
    permissionsError,
    proxy,
    vpnProvider,
    auth,
});
