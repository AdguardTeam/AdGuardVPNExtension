import nanoid from 'nanoid';
import { getHostname } from '../../lib/helpers';
import log from '../../lib/logger';
import { MESSAGES_TYPES } from '../../lib/constants';

export default class Exclusions {
    constructor(browser, proxy, settings) {
        this.browser = browser;
        this.proxy = proxy;
        this.settings = settings;
    }

    init = async () => {
        this.exclusions = this.settings.getExclusions();
        // update bypass list in proxy on init
        await this.handleExclusionsUpdate();
        log.info('Exclusions list is ready');
    };

    handleExclusionsUpdate = async (exclusion) => {
        if (exclusion) {
            this.browser.runtime.sendMessage({
                type: MESSAGES_TYPES.EXCLUSION_UPDATED,
                data: { exclusion },
            });
        }
        const enabledExclusions = Object.values(this.exclusions)
            .filter(({ enabled }) => enabled)
            .map(({ hostname }) => hostname);
        await this.proxy.setBypassList(enabledExclusions);
        this.settings.setExclusions(this.exclusions);
    };

    addToExclusions = async (url) => {
        const hostname = getHostname(url);

        if (!hostname) {
            return;
        }

        // if was disabled, then enable
        let exclusion = Object.values(this.exclusions).find((exclusion) => {
            return exclusion.hostname === hostname;
        });

        if (exclusion) {
            if (!exclusion.enabled) {
                this.exclusions[exclusion.id] = { ...exclusion, enabled: true };
            }
        } else {
            const id = nanoid();
            exclusion = { id, hostname, enabled: true };
            this.exclusions[id] = exclusion;
        }
        await this.handleExclusionsUpdate(exclusion);
    };

    removeFromExclusions = async (id) => {
        const exclusion = this.exclusions[id];
        if (!exclusion) {
            return;
        }
        delete this.exclusions[id];
        await this.handleExclusionsUpdate(exclusion);
    };

    removeFromExclusionsByHostname = async (hostname) => {
        const exclusion = Object.values(this.exclusions).find((val) => {
            return val.hostname === hostname;
        });
        delete this.exclusions[exclusion.id];
        await this.handleExclusionsUpdate(exclusion);
    };

    isExcluded = (url) => {
        const hostname = getHostname(url);
        if (hostname) {
            const exclusion = Object.values(this.exclusions)
                .find(exclusion => exclusion.hostname === hostname);
            return !!(exclusion && exclusion.enabled);
        }
        return false;
    };

    toggleExclusion = async (id) => {
        let exclusion = this.exclusions[id];
        if (!exclusion) {
            return;
        }

        exclusion = { ...exclusion, enabled: !exclusion.enabled };
        this.exclusions[id] = exclusion;
        await this.handleExclusionsUpdate(exclusion);
    };

    renameExclusion = async (id, newUrl) => {
        const hostname = getHostname(newUrl);
        if (!hostname) {
            return;
        }
        const exclusion = this.exclusions[id];
        if (!exclusion) {
            return;
        }
        this.exclusions[id] = { ...exclusion, hostname };
        await this.handleExclusionsUpdate();
    };

    clearExclusions = async () => {
        this.exclusions = {};
        await this.handleExclusionsUpdate();
    };

    getExclusions = () => {
        return Object.values(this.exclusions);
    };
}
