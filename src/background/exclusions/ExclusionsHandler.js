import nanoid from 'nanoid';
import { getHostname } from '../../lib/helpers';
import { areHostnamesEqual, shExpMatch } from '../../lib/string-utils';
import log from '../../lib/logger';

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
     * Adds url to exclusions
     * @param {string} url
     * @param {boolean} [enabled] - sets state of exclusion
     * @param {object} [options]
     * @param {boolean} [options.considerWildcard] - used to add new exclusions without affecting
     *      exclusions with wildcard patterns
     * @param {boolean} [options.forceEnable] - urls added by non routable sites handler should not
     *      enable exclusions disabled by user
     * @returns {Promise<void>}
     */
    addToExclusions = async (
        url,
        enabled = true,
        options = {}
    ) => {
        const hostname = getHostname(url);

        if (!hostname) {
            return;
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
            await this.handleExclusionsUpdate(exclusion);
        }
    };

    removeFromExclusions = async (id) => {
        const exclusion = this._exclusions[id];
        if (!exclusion) {
            return;
        }
        delete this._exclusions[id];

        await this.handleExclusionsUpdate(exclusion);
    };

    disableExclusionByUrl = async (hostname) => {
        const exclusions = this.getExclusionsByUrl(hostname);

        exclusions.forEach((exclusion) => {
            this._exclusions[exclusion.id] = { ...exclusion, enabled: false };
        });

        await this.handleExclusionsUpdate(exclusions);
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

    toggleExclusion = async (id) => {
        let exclusion = this._exclusions[id];
        if (!exclusion) {
            return;
        }

        exclusion = { ...exclusion, enabled: !exclusion.enabled };
        this._exclusions[id] = exclusion;
        await this.handleExclusionsUpdate(exclusion);
    };

    renameExclusion = async (id, newUrl) => {
        const hostname = getHostname(newUrl);
        if (!hostname) {
            return;
        }
        const exclusion = this._exclusions[id];
        if (!exclusion) {
            return;
        }
        this._exclusions[id] = { ...exclusion, hostname };
        await this.handleExclusionsUpdate();
    };

    clearExclusions = async () => {
        this._exclusions = {};
        await this.handleExclusionsUpdate();
    };

    get exclusions() {
        return this._exclusions;
    }

    getExclusionsList = () => {
        return Object.values(this._exclusions);
    };
}
