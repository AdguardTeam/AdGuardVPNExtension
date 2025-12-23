import browser from 'webextension-polyfill';

import { getForwarderUrl } from '../common/helpers';
import { log } from '../common/logger';

import { FORWARDER_URL_QUERIES } from './config';

/**
 * Runs generator with possibility to cancel.
 *
 * @param fn - generator to run
 * @param args - args
 *
 * @returns Object with cancel function and promise.
 */
export const runWithCancel = (fn: (...args: any) => any, ...args: any):
{ cancel?: Function, promise: Promise<unknown> } => {
    const gen = fn(...args);
    let cancelled: boolean;
    let cancel;
    const promise = new Promise((resolve, reject) => {
        // define cancel function to return it from our fn
        cancel = (reason: string): void => {
            cancelled = true;
            reject(new Error(reason));
        };

        // eslint-disable-next-line consistent-return
        function onFulfilled(res?: string): void {
            if (!cancelled) {
                let result;
                try {
                    result = gen.next(res);
                } catch (e) {
                    return reject(e);
                }
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                next(result);
            }
        }

        // eslint-disable-next-line consistent-return
        function onRejected(err: Error): void {
            let result;
            try {
                result = gen.throw(err);
            } catch (e) {
                return reject(e);
            }
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            next(result);
        }

        function next({ done, value }: { done: boolean, value: Promise<any> }): Promise<void> | void {
            if (done) {
                return resolve(value);
            }
            // we assume we always receive promises, so no type checks
            return value.then(onFulfilled, onRejected);
        }

        onFulfilled();
    });

    return { promise, cancel };
};

/**
 * Sets uninstall url for the extension with retry.
 *
 * @param forwarderDomain Forwarder domain.
 */
export const setExtensionUninstallUrl = async (forwarderDomain: string): Promise<void> => {
    try {
        const uninstallUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.UNINSTALL_PAGE);

        await browser.runtime.setUninstallURL(uninstallUrl);

        log.info(`[vpn.helpers]: Uninstall url was set to: ${uninstallUrl}`);
    } catch (e) {
        log.error('[vpn.helpers]: ', e.message);
    }
};
