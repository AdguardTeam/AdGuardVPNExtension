import throttle from 'lodash/throttle';
import ipaddr from 'ipaddr.js';
import browser from 'webextension-polyfill';
import log from '../../lib/logger';
import notifier from '../../lib/notifier';
import { getHostname } from '../../lib/helpers';
import { NON_ROUTABLE_NETS } from './nonRoutableNets';

class NonRoutableService {
    NON_ROUTABLE_KEY = 'non-routable.storage.key';

    NON_ROUTABLE_MAX_LENGTH = 1000;

    CLEAR_CAPACITY = 50;

    STORAGE_UPDATE_TIMEOUT_MS = 1000;

    LOCALHOST = 'localhost';

    nonRoutableList = [];

    constructor(storage) {
        this.storage = storage;
        this.parsedCIDRList = NON_ROUTABLE_NETS.map((net) => ipaddr.parseCIDR(net));
    }

    async init() {
        this.nonRoutableList = (await this.storage.get(this.NON_ROUTABLE_KEY)) || [];
        notifier.addSpecifiedListener(
            notifier.types.NON_ROUTABLE_DOMAIN_FOUND,
            this.handleNonRoutableDomains
        );
        browser.webRequest.onErrorOccurred.addListener(
            this.handleWebRequestErrors,
            { urls: ['<all_urls>'] }
        );
        log.info('NonRoutable module was initiated successfully');
    }

    /**
     * Storage for hostnames from request errors
     * @type {Map<string, number>}
     */
    webRequestErrorHostnames = new Map();

    /**
     * Storage for for hostnames from non-routable events
     * @type {Map<string, number>}
     */
    nonRoutableHostnames = new Map();

    /**
     * Looks for hostname in the storage
     * @param {string} hostname
     * @param {Map<string, number>} storage
     * @returns {boolean}
     */
    lookHostnameInStorage = (hostname, storage) => {
        if (storage.has(hostname)) {
            storage.delete(hostname);
            return true;
        }

        return false;
    };

    /**
     * Clears values in the storage with timestamp older then VALUE_TTL_MS
     * @param {Map<string, number>} storage
     */
    clearStaledValues = (storage) => {
        const VALUE_TTL_MS = 1000;
        const currentTime = Date.now();
        // eslint-disable-next-line no-restricted-syntax
        for (const [key, value] of storage) {
            if (value < (currentTime - VALUE_TTL_MS)) {
                storage.delete(key);
            }
        }
    };

    /**
     * Adds non-routable domain only if founds it in the map with domains from web request errors,
     * else saves it in the storage with current time
     * @param nonRoutableDomain
     */
    handleNonRoutableDomains = (nonRoutableDomain) => {
        if (!nonRoutableDomain) {
            return;
        }
        const hostname = getHostname(nonRoutableDomain);
        const result = this.lookHostnameInStorage(hostname, this.webRequestErrorHostnames);
        if (result) {
            this.addNonRoutableHandler(hostname);
        } else {
            this.nonRoutableHostnames.set(hostname, Date.now());
        }
        this.clearStaledValues(this.nonRoutableHostnames);
    };

    /**
     * Handles web request errors, if error occurs for main frame, checks it in the storage with
     * non-routable hostnames, if founds same hostname then adds it to the list of
     * non-routable hostnames, otherwise saves it the storage
     * @param details
     */
    handleWebRequestErrors = (details) => {
        const MAIN_FRAME = 'main_frame';
        const ERROR = 'net::ERR_TUNNEL_CONNECTION_FAILED';

        const { error, url, type } = details;

        if (error === ERROR && type === MAIN_FRAME) {
            const hostname = getHostname(url);
            if (!hostname) {
                return;
            }
            const result = this.lookHostnameInStorage(hostname, this.nonRoutableHostnames);
            if (result) {
                this.addNonRoutableHandler(hostname);
            } else {
                this.webRequestErrorHostnames.set(hostname, Date.now());
            }
            this.clearStaledValues(this.webRequestErrorHostnames);
        }
    };

    addNonRoutableHandler(payload) {
        const hostname = getHostname(payload);
        this.addHostname(hostname);
        notifier.notifyListeners(notifier.types.NON_ROUTABLE_DOMAIN_ADDED, hostname);
    }

    updateStorage = throttle(async () => {
        while (this.nonRoutableList.length > this.NON_ROUTABLE_MAX_LENGTH) {
            this.nonRoutableList = this.nonRoutableList.slice(this.CLEAR_CAPACITY);
        }

        await this.storage.set(this.NON_ROUTABLE_KEY, this.nonRoutableList);
    }, this.STORAGE_UPDATE_TIMEOUT_MS);

    addHostname(hostname) {
        if (this.nonRoutableList.includes(hostname)) {
            return;
        }
        this.nonRoutableList.push(hostname);
        this.updateStorage();
    }

    isUrlRoutable(url) {
        const hostname = getHostname(url);
        if (!hostname) {
            return true;
        }

        if (hostname === this.LOCALHOST
            || this.nonRoutableList.includes(hostname)) {
            return false;
        }

        if (!ipaddr.isValid(hostname)) {
            return true;
        }

        const addr = ipaddr.parse(hostname);

        if (addr.kind() === 'ipv6') {
            return true;
        }

        return !this.parsedCIDRList.some((parsedCIDR) => addr.match(parsedCIDR));
    }

    getNonRoutableList() {
        return this.nonRoutableList;
    }
}

export default NonRoutableService;
