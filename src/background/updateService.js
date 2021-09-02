import browserApi from './browserApi';
import credentials from './credentials';
import { UPGRADE_LICENSE_URL } from './config';

const APP_VERSION_KEY = 'update.service.app.version';

const getAppVersionFromStorage = () => {
    return browserApi.storage.get(APP_VERSION_KEY);
};

const getAppVersionFromManifest = () => {
    return browserApi.runtime.getManifest().version;
};

const setAppVersionInStorage = (appVersion) => {
    return browserApi.storage.set(APP_VERSION_KEY, appVersion);
};

/**
 * Returns run info
 * @returns {Promise<{
 *  isFirstRun: boolean,
 *  isUpdate: boolean,
 *  currentVersion: string,
 *  prevVersion: string
 *  }>}
 */
const getRunInfo = async () => {
    const prevVersion = await getAppVersionFromStorage();
    const currentVersion = await getAppVersionFromManifest();

    await setAppVersionInStorage(currentVersion);

    const isFirstRun = (currentVersion !== prevVersion && !prevVersion);
    const isUpdate = !!(currentVersion !== prevVersion && prevVersion);

    return {
        isFirstRun,
        isUpdate,
        currentVersion,
        prevVersion,
    };
};

export const getPremiumPromoPageUrl = async () => {
    const username = await credentials.getUsername();
    if (username) {
        return `${UPGRADE_LICENSE_URL}&email=${encodeURIComponent(username)}`;
    }
    return UPGRADE_LICENSE_URL;
};

export default {
    getRunInfo,
};
