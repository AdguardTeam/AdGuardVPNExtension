import browser from 'webextension-polyfill';
import storage from './storage';

const APP_VERSION_KEY = 'update.service.app.version';

const getAppVersionFromStorage = () => {
    return storage.get(APP_VERSION_KEY);
};

const getAppVersionFromManifest = () => {
    return browser.runtime.getManifest().version;
};

const setAppVersionInStorage = (appVersion) => {
    return storage.set(APP_VERSION_KEY, appVersion);
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

export default {
    getRunInfo,
};
