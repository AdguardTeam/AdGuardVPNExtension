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

/**
 * Converts regular and selective exclusions from object, for example:
 * { 5idvOJ7fv23sY8aHbe: { enabled: true, hostname: 'example.org', id: '5idvOJ7fv23sY8aHbe' } }
 * to array of objects:
 * [{ enabled: true, hostname: 'example.org' id: '5idvOJ7fv23sY8aHbe' }]
 */
const convertExclusions = async () => {
    const exclusions = settings.getSetting(SETTINGS_IDS.EXCLUSIONS);
    try {
        exclusions.regular = Object.values(exclusions.regular);
        exclusions.selective = Object.values(exclusions.selective);
    } catch (e) {
        log.error(`Error converting exclusions on update to v0.12.4 due to a reason: ${e.message}`);
        return;
    }
    await settings.setSetting(SETTINGS_IDS.EXCLUSIONS, exclusions, true);
};

/**
 * Handle application update
 *
 * @param runInfo   Run info
 */
const onUpdate = async (runInfo) => {
    log.info(`On update from v${runInfo.prevVersion} to ${runInfo.currentVersion}`);

    if (versionUtils.isGreaterVersion('0.12.4', runInfo.prevVersion)) {
        await convertExclusions();
    }
};

export default {
    getRunInfo,
    onUpdate,
};
