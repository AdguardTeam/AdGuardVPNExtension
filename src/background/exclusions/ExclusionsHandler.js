import { nanoid } from 'nanoid';
import punycode from 'punycode/';

import { getHostname } from '../../lib/helpers';
import { areHostnamesEqual, shExpMatch } from '../../lib/string-utils';
import { log } from '../../lib/logger';

export default class ExclusionsHandler {
    _exclusions = [];

    constructor(updateHandler, exclusions, mode) {
        this.updateHandler = updateHandler;
        Object.values(exclusions).forEach((exc) => this._exclusions.push(exc));
        this._mode = mode;
    }

    get mode() {
        return this._mode;
    }

    handleExclusionsUpdate = (exclusions) => {
        if (exclusions && exclusions.length > 0) {
            this.updateHandler(this._mode, this._exclusions, exclusions);
        } else {
            this.updateHandler(this._mode, this._exclusions);
        }
    };

    /**
     * Normalizes exclusions url
     * 1. trims it
     * 2. converts to lowercase
     * 3. converts to ASCII
     * @param {string} rawUrl
     * @return {string | undefined}
     */
    prepareUrl = (rawUrl) => {
        const url = rawUrl?.trim()?.toLowerCase();
        return punycode.toASCII(url);
    }

    /**
     * Adds url to exclusions
     * @param {string} dirtyUrl
     * @param {boolean} [enabled] - sets state of exclusion
     * @param {object} [options]
     * @param {boolean} [options.considerWildcard] - used to add new exclusions without affecting
     *      exclusions with wildcard patterns
     * @param {boolean} [options.forceEnable] - urls added by non routable sites handler should not
     *      enable exclusions disabled by user
     * @returns {boolean}
     */
    addToExclusions = (
        dirtyUrl,
        enabled = true,
        options = {},
    ) => {
        const url = this.prepareUrl(dirtyUrl);
        // save hostnames as ASCII because 'pacScript.url' supports only ASCII URLs
        // https://chromium.googlesource.com/chromium/src/+/3a46e0bf9308a42642689c4b73b6b8622aeecbe5/chrome/browser/extensions/api/proxy/proxy_api_helpers.cc#115
        const hostname = getHostname(url);

        if (!hostname) {
            return false;
        }

        const {
            considerWildcard = true,
            forceEnable = true,
        } = options;

        // check there are already exclusions for current url
        const exclusions = this.getExclusionsByUrl(url, considerWildcard);

        let shouldUpdate = false;

        let exclusion;

        // if it was disabled, enable, otherwise add the new one
        if (exclusions.length > 0) {
            [exclusion] = exclusions;
            if (!exclusion.enabled && enabled && forceEnable) {
                this.updateExclusionProperty(exclusion.id, { enabled });
                shouldUpdate = true;
            }
        } else {
            const id = nanoid();
            exclusion = { id, hostname, enabled };
            this._exclusions.push(exclusion);
            log.info(`Added to exclusions: ${hostname}`);
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            this.handleExclusionsUpdate(exclusion);
            return true;
        }

        return false;
    };

    removeFromExclusions = (id) => {
        const exclusion = this._exclusions.find((exc) => exc.id === id);
        if (!exclusion) {
            return;
        }
        this._exclusions = this._exclusions.filter((exc) => exc.id !== id);
        this.handleExclusionsUpdate(exclusion);
    };

    removeExclusions = () => {
        this._exclusions = [];
        this.handleExclusionsUpdate();
    };

    disableExclusionByUrl = (hostname) => {
        const exclusions = this.getExclusionsByUrl(hostname);

        exclusions.forEach((exclusion) => {
            this.updateExclusionProperty(exclusion.id, { enabled: false });
        });

        this.handleExclusionsUpdate(exclusions);
    };

    /**
     * Returns exclusion by url
     * @param url
     * @param includeWildcards
     * @returns {undefined,Exclusions[]}
     */
    getExclusionsByUrl = (url, includeWildcards = true) => {
        const hostname = getHostname(url);
        if (!hostname) {
            return undefined;
        }
        return this._exclusions
            .filter((exclusion) => areHostnamesEqual(hostname, exclusion.hostname)
                || (includeWildcards && shExpMatch(hostname, exclusion.hostname)));
    };

    isExcluded = (url) => {
        if (!url) {
            return false;
        }

        const exclusions = this.getExclusionsByUrl(url);
        return exclusions.some((exclusion) => exclusion.enabled);
    };

    toggleExclusion = (id) => {
        const exclusion = this._exclusions.find((exc) => exc.id === id);
        if (!exclusion) {
            return;
        }

        this._exclusions.forEach((exc) => {
            if (exc.id === id) {
                // eslint-disable-next-line no-param-reassign
                exc.enabled = !exc.enabled;
                this.handleExclusionsUpdate(exc);
            }
        });
    };

    renameExclusion = (id, newUrl) => {
        const hostname = getHostname(this.prepareUrl(newUrl));

        if (!hostname) {
            return;
        }
        this.updateExclusionProperty(id, { hostname });
        this.handleExclusionsUpdate();
    };

    get exclusions() {
        return this._exclusions;
    }

    getExclusionsList = () => {
        return this._exclusions;
    };

    /**
     * Updates exclusion's property
     * @param {string} id
     * @param {object} prop
     */
    updateExclusionProperty = (id, prop) => {
        const propKey = Object.keys(prop)[0];
        this._exclusions.forEach((exc) => {
            if (exc.id === id) {
                // eslint-disable-next-line no-param-reassign
                exc[propKey] = prop[propKey];
            }
        });
    }
}
