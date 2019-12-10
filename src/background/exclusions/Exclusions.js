import ExclusionsHandler from './ExclusionsHandler';
import log from '../../lib/logger';
import { MESSAGES_TYPES } from '../../lib/constants';

class Exclusions {
    TYPES = {
        WHITELIST: 'whitelist',
        BLACKLIST: 'blacklist',
    };

    constructor(browser, proxy, settings) {
        this.browser = browser;
        this.proxy = proxy;
        this.settings = settings;
    }

    init = async () => {
        this.exclusions = this.settings.getExclusions() || {};

        const whitelist = this.exclusions?.[this.TYPES.WHITELIST] ?? {};
        const blacklist = this.exclusions?.[this.TYPES.BLACKLIST] ?? {};

        this.inverted = this.exclusions?.inverted ?? 'false';

        this.whitelistHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            whitelist,
            this.TYPES.WHITELIST
        );

        this.blacklistHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            blacklist,
            this.TYPES.BLACKLIST
        );

        this.currentHandler = this.inverted ? this.whitelistHandler : this.blacklistHandler;
        // update bypass list in proxy on init
        await this.handleExclusionsUpdate();
        log.info('ExclusionsHandler list is ready');
    };

    handleExclusionsUpdate = async (exclusion) => {
        if (exclusion) {
            this.browser.runtime.sendMessage({
                type: MESSAGES_TYPES.EXCLUSION_UPDATED,
                data: { exclusion },
            });
        }

        const enabledExclusions = this.current.getExclusionsList()
            .filter(({ enabled }) => enabled)
            .map(({ hostname }) => hostname);

        await this.proxy.setBypassList(enabledExclusions, this.inverted);

        const exclusions = {
            inverted: this.inverted,
            [this.TYPES.WHITELIST]: this.whitelist.exclusions,
            [this.TYPES.BLACKLIST]: this.blacklist.exclusions,
        };

        this.settings.setExclusions(exclusions);
    };

    async setCurrentHandler(type) {
        switch (type) {
            case this.TYPES.WHITELIST: {
                this.currentHandler = this.whitelistHandler;
                this.inverted = true;
                break;
            }
            case this.TYPES.BLACKLIST: {
                this.currentHandler = this.blacklistHandler;
                this.inverted = false;
                break;
            }
            default:
                throw Error(`Wrong type received ${type}`);
        }
        await this.handleExclusionsUpdate();
    }

    getHandler(type) {
        switch (type) {
            case this.TYPES.WHITELIST: {
                return this.whitelist;
            }
            case this.TYPES.BLACKLIST: {
                return this.blacklist;
            }
            default:
                throw Error(`Wrong type requested: ${type}`);
        }
    }

    get whitelist() {
        return this.whitelistHandler;
    }

    get blacklist() {
        return this.blacklistHandler;
    }

    get current() {
        return this.currentHandler;
    }

    isInverted() {
        return this.inverted;
    }
}

export default Exclusions;
