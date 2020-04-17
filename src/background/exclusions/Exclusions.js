import ExclusionsHandler from './ExclusionsHandler';
import log from '../../lib/logger';
import { MESSAGES_TYPES } from '../../lib/constants';
import notifier from '../../lib/notifier';
import { EXCLUSIONS_MODES } from './exclusionsConstants';

class Exclusions {
    MODES = EXCLUSIONS_MODES;

    constructor(browser, proxy, settings) {
        this.browser = browser;
        this.proxy = proxy;
        this.settings = settings;
    }

    init = async () => {
        this.exclusions = this.settings.getExclusions() || {};

        const selective = this.exclusions?.[this.MODES.SELECTIVE] ?? {};
        const regular = this.exclusions?.[this.MODES.REGULAR] ?? {};

        this.inverted = this.exclusions?.inverted ?? false;

        this.selectiveModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            selective,
            this.MODES.SELECTIVE
        );

        this.regularModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            regular,
            this.MODES.REGULAR
        );

        this.currentHandler = this.inverted ? this.selectiveModeHandler : this.regularModeHandler;
        // update bypass list in proxy on init
        await this.handleExclusionsUpdate();

        notifier.addSpecifiedListener(notifier.types.NON_ROUTABLE_DOMAIN_ADDED, (payload) => {
            if (this.currentHandler.mode === this.MODES.REGULAR) {
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
        }

        notifier.notifyListeners(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE);

        const enabledExclusions = this.current.getExclusionsList()
            .filter(({ enabled }) => enabled)
            .map(({ hostname }) => hostname);

        await this.proxy.setBypassList(enabledExclusions, this.inverted);

        const exclusionsRepository = {
            inverted: this.inverted,
            [this.MODES.SELECTIVE]: this.selective.exclusions,
            [this.MODES.REGULAR]: this.regular.exclusions,
        };

        this.settings.setExclusions(exclusionsRepository);
    };

    async setCurrentMode(mode) {
        switch (mode) {
            case this.MODES.SELECTIVE: {
                this.currentHandler = this.selectiveModeHandler;
                this.inverted = true;
                break;
            }
            case this.MODES.REGULAR: {
                this.currentHandler = this.regularModeHandler;
                this.inverted = false;
                break;
            }
            default:
                throw Error(`Wrong type received ${mode}`);
        }
        await this.handleExclusionsUpdate();
    }

    getHandler(type) {
        switch (type) {
            case this.MODES.SELECTIVE: {
                return this.selective;
            }
            case this.MODES.REGULAR: {
                return this.regular;
            }
            default:
                throw Error(`Wrong type requested: ${type}`);
        }
    }

    get selective() {
        return this.selectiveModeHandler;
    }

    get regular() {
        return this.regularModeHandler;
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
