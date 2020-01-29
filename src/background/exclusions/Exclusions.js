import ExclusionsHandler from './ExclusionsHandler';
import log from '../../lib/logger';
import { MESSAGES_TYPES } from '../../lib/constants';
import notifier from '../../lib/notifier';

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

        this.inverted = this.exclusions?.inverted ?? false;

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

        notifier.addSpecifiedListener(notifier.types.ADD_NON_ROUTABLE_DOMAIN, (payload) => {
            if (this.currentHandler.type === this.TYPES.BLACKLIST) {
                this.currentHandler.addToExclusions(payload, true, { forceEnable: false });
            }
        });

        log.info('ExclusionsHandler list is ready');
    };

    handleExclusionsUpdate = async (exclusions) => {
        if (exclusions) {
            this.browser.runtime.sendMessage({
                type: MESSAGES_TYPES.EXCLUSIONS_UPDATED,
                data: { exclusions },
            });
            notifier.notifyListeners(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE);
        }

        const enabledExclusions = this.current.getExclusionsList()
            .filter(({ enabled }) => enabled)
            .map(({ hostname }) => hostname);

        await this.proxy.setBypassList(enabledExclusions, this.inverted);

        const exclusionsRepository = {
            inverted: this.inverted,
            [this.TYPES.WHITELIST]: this.whitelist.exclusions,
            [this.TYPES.BLACKLIST]: this.blacklist.exclusions,
        };

        this.settings.setExclusions(exclusionsRepository);
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

    async enableVpnByUrl(url) {
        if (this.inverted) {
            await this.currentHandler.addToExclusions(url);
        } else {
            await this.currentHandler.disableExclusionByUrl(url);
        }
    }

    async disableVpnByUrl(url) {
        if (this.inverted) {
            await this.currentHandler.disableExclusionByUrl(url);
        } else {
            await this.currentHandler.addToExclusions(url);
        }
    }

    isVpnEnabledByUrl(url) {
        const isExcluded = this.currentHandler.isExcluded(url);
        return this.inverted ? isExcluded : !isExcluded;
    }

    isInverted() {
        return this.inverted;
    }
}

export default Exclusions;
