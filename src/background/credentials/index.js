import browserApi from '../browserApi';
import permissionsError from '../permissionsChecker/permissionsError';
import proxy from '../proxy';
import vpnProvider from '../providers/vpnProvider';
import auth from '../auth';
import Credentials from './Credentials';

const credentials = new Credentials({
    browserApi,
    permissionsError,
    proxy,
    vpnProvider,
    auth,
});

export default credentials;
