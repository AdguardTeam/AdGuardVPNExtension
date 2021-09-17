import browserApi from './browserApi';
import { log } from '../lib/logger';
import versionUtils from '../lib/version';
import { SETTINGS_IDS } from '../lib/constants';
import { settings } from './settings';

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

const convertExclusions = () => {
    const exclusions = settings.getSetting(SETTINGS_IDS.EXCLUSIONS);
    log.info(exclusions);
    // TODO convert exclusions
};

/**
 * Handle application update
 *
 * @param runInfo   Run info
 * @param callback  Called after update was handled
 */
const onUpdate = (runInfo, callback) => {
    log.info(`On update from v${runInfo.prevVersion} to ${runInfo.currentVersion}`);

    if (versionUtils.isGreaterVersion('0.12.4', runInfo.prevVersion)) {
        convertExclusions();
    }
    callback();
};

export default {
    getRunInfo,
    onUpdate,
};
