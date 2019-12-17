import nanoid from 'nanoid';
import { getHostname } from '../../lib/helpers';
import log from '../../lib/logger';

export default class ExclusionsHandler {
    constructor(updateHandler, exclusions, type) {
        this.updateHandler = updateHandler;
        this._exclusions = exclusions;
        this._type = type;
    }

    get type() {
        return this._type;
    }

    handleExclusionsUpdate = (exclusion) => {
        if (exclusion) {
            this.updateHandler(this._type, this._exclusions, exclusion);
        } else {
            this.updateHandler(this._type, this._exclusions);
        }
    };

    /**
     * Adds url to exclusions
     * @param {string} url
     * @param {boolean} enable - enable if was disabled by user
     * @returns {Promise<void>}
     */
    addToExclusions = async (url, enable = true) => {
        const hostname = getHostname(url);

        if (!hostname) {
            return;
        }

        // check if exclusion existed
        let exclusion = Object.values(this._exclusions).find((exclusion) => {
            return exclusion.hostname === hostname;
        });

        let shouldUpdate = false;

        // if it was disabled, enable, otherwise add the new one
        if (exclusion) {
            if (!exclusion.enabled && enable) {
                this._exclusions[exclusion.id] = { ...exclusion, enabled: true };
                shouldUpdate = true;
            }
        } else {
            const id = nanoid();
            exclusion = { id, hostname, enabled: true };
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

    disableExclusionByHostname = async (hostname) => {
        const exclusion = Object.values(this._exclusions).find((val) => {
            return val.hostname === hostname;
        });

        if (!exclusion) {
            return;
        }

        this._exclusions[exclusion.id] = { ...exclusion, enabled: false };
        await this.handleExclusionsUpdate(exclusion);
    };

    isExcluded = (url) => {
        const hostname = getHostname(url);
        if (hostname) {
            const exclusion = Object.values(this._exclusions)
                .find(exclusion => exclusion.hostname === hostname);
            return !!(exclusion && exclusion.enabled);
        }
        return false;
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
