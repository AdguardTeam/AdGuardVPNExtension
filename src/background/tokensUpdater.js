import browser from 'webextension-polyfill';
import credentials from './credentials';
import appStatus from './appStatus';
import log from '../lib/logger';
import { MESSAGES_TYPES } from '../lib/constants';

const updateTokens = async () => {
    await credentials.getVpnTokenRemote();
    await credentials.gainVpnCredentials(true);
    log.info('Tokens were updated successfully');
};

const updateTokensErrorHandler = (error) => {
    // TODO [maximtop] show global error;
    log.error('Tokens were not updated due to:', error.message);
    appStatus.setGlobalError(error);
    browser.runtime.sendMessage({ type: MESSAGES_TYPES.TOKENS_UPDATE_ERROR, data: error.message });
};

const scheduler = (periodicFunction, errorHandler) => {
    const TIME_CHECK_INTERVAL_MS = 5 * 1000; // 5 sec
    const RUN_INTERVAL_MS = 1 * 10 * 1000; // 30 minutes

    let prevCheck = Date.now();

    const intervalId = setInterval(async () => {
        log.info('Check time');
        const currTime = Date.now();
        if (currTime >= prevCheck + RUN_INTERVAL_MS) {
            try {
                await periodicFunction();
            } catch (e) {
                errorHandler(e);
                // TODO Should we stop to check or not?
                clearInterval(intervalId);
            }
            prevCheck += RUN_INTERVAL_MS;
        }
    }, TIME_CHECK_INTERVAL_MS);
};

const init = () => {
    log.info('Tokens updater was initiated');
    scheduler(updateTokens, updateTokensErrorHandler);
};

const tokensUpdater = {
    init,
};

export default tokensUpdater;
