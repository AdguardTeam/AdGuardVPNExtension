import { nanoid } from 'nanoid';

import { getHostname } from '../../lib/helpers';
import { areHostnamesEqual, shExpMatch } from '../../lib/string-utils';
import { log } from '../../lib/logger';

export default class ExclusionsHandler {
    constructor(updateHandler, exclusions, mode) {
        this.updateHandler = updateHandler;
        this._exclusions = exclusions;
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
     * @param {string} url
     * @return {string | undefined}
     */
    prepareUrl = (url) => {
        return url?.trim()?.toLowerCase();
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
                this._exclusions[exclusion.id] = { ...exclusion, enabled };
                shouldUpdate = true;
            }
        } else {
            const id = nanoid();
            exclusion = { id, hostname, enabled };
            this._exclusions[id] = exclusion;
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
        const exclusion = this._exclusions[id];
        if (!exclusion) {
            return;
        }
        delete this._exclusions[id];

        this.handleExclusionsUpdate(exclusion);
    };

    removeExclusions = () => {
        this._exclusions = {};

        this.handleExclusionsUpdate();
    };

    disableExclusionByUrl = (hostname) => {
        const exclusions = this.getExclusionsByUrl(hostname);

        exclusions.forEach((exclusion) => {
            this._exclusions[exclusion.id] = { ...exclusion, enabled: false };
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
        return Object.values(this._exclusions)
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
        let exclusion = this._exclusions[id];
        if (!exclusion) {
            return;
        }

        exclusion = { ...exclusion, enabled: !exclusion.enabled };
        this._exclusions[id] = exclusion;
        this.handleExclusionsUpdate(exclusion);
    };

    renameExclusion = (id, newUrl) => {
        const hostname = getHostname(newUrl);
        if (!hostname) {
            return;
        }
        const exclusion = this._exclusions[id];
        if (!exclusion) {
            return;
        }
        this._exclusions[id] = { ...exclusion, hostname };
        this.handleExclusionsUpdate();
    };

    clearExclusions = () => {
        this._exclusions = {};
        this.handleExclusionsUpdate();
    };

    get exclusions() {
        return this._exclusions;
    }

    getExclusionsList = () => {
        return Object.values(this._exclusions);
    };
}
