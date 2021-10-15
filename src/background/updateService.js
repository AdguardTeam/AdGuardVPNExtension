import browserApi from './browserApi';
import { USER_STATE_KEYS } from '../lib/constants';
import { userState } from './userState';

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

    await userState.set(USER_STATE_KEYS.IS_FIRST_RUN, isFirstRun);

    return {
        isFirstRun,
        isUpdate,
        currentVersion,
        prevVersion,
    };
};

export default {
    getRunInfo,
};
