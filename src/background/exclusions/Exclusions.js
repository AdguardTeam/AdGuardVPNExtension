// eslint-disable-next-line import/named
import { ExclusionsHandler } from './ExclusionsHandler';
import { log } from '../../lib/logger';
import notifier from '../../lib/notifier';
import { State } from './ExclusionsGroup';
import { EXCLUSIONS_MODES } from '../../common/exclusionsConstants';
import { servicesManager } from './ServicesManager';

class Exclusions {
    MODES = EXCLUSIONS_MODES;

    constructor(browser, proxy, settings) {
        this.browser = browser;
        this.proxy = proxy;
        this.settings = settings;
    }

    init = async () => {
        await servicesManager.init();

        this.exclusions = this.settings.getExclusions() || {};

        const selective = this.exclusions?.[this.MODES.SELECTIVE] ?? [];
        const regular = this.exclusions?.[this.MODES.REGULAR] ?? [];

        this.inverted = this.exclusions?.inverted ?? false;

        this.selectiveModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            selective,
            this.MODES.SELECTIVE,
        );

        this.regularModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            regular,
            this.MODES.REGULAR,
        );

        this.currentHandler = this.inverted ? this.selectiveModeHandler : this.regularModeHandler;
        // update bypass list in proxy on init
        await this.handleExclusionsUpdate();

        notifier.addSpecifiedListener(notifier.types.NON_ROUTABLE_DOMAIN_ADDED, (payload) => {
            if (this.currentHandler.mode === this.MODES.REGULAR) {
                // TODO handle properly
                this.currentHandler.addToExclusions(payload, true, { forceEnable: false });
            }
        });

        log.info('ExclusionsHandler list is ready');
    };

    handleExclusionsUpdate = async () => {
        notifier.notifyListeners(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE);

        const exclusionsData = this.current.getExclusions();

        // eslint-disable-next-line array-callback-return
        const enabledServices = exclusionsData.excludedServices.map((service) => {
            // TODO: handle state
            // eslint-disable-next-line consistent-return,array-callback-return
            service.exclusionsGroups.map((group) => {
                if (group.state === State.Enabled || group.state === State.PartlyEnabled) {
                    return group.exclusions
                        .filter(({ enabled }) => enabled)
                        .map(({ hostname }) => hostname);
                }
            });
        });

        // eslint-disable-next-line consistent-return,array-callback-return
        const enabledGroups = exclusionsData.exclusionsGroups.map((group) => {
            if (group.state === State.Enabled || group.state === State.PartlyEnabled) {
                return group.exclusions
                    .filter(({ enabled }) => enabled)
                    .map(({ hostname }) => hostname);
            }
        });

        const enabledIps = exclusionsData
            .filter(({ enabled }) => enabled)
            .map(({ hostname }) => hostname);

        await this.proxy
            .setBypassList([...enabledServices, ...enabledGroups, ...enabledIps], this.inverted);

        const exclusionsRepository = {
            inverted: this.inverted,
            [this.MODES.SELECTIVE]: {
                excludedServices: this.selective.exclusions.excludedServices,
                exclusionsGroups: this.selective.exclusions.exclusionsGroups,
                excludedIps: this.selective.exclusions.excludedIps,
            },
            [this.MODES.REGULAR]: {
                excludedServices: this.regular.exclusions.excludedServices,
                exclusionsGroups: this.regular.exclusions.exclusionsGroups,
                excludedIps: this.regular.exclusions.excludedIps,
            },
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

    getHandler(mode) {
        switch (mode) {
            case this.MODES.SELECTIVE: {
                return this.selective;
            }
            case this.MODES.REGULAR: {
                return this.regular;
            }
            default:
                throw Error(`Wrong mode requested: ${mode}`);
        }
    }

    // TODO: handle adding to exclusions (ip case)
    addRegularExclusions(exclusions) {
        let addedExclusions = 0;
        exclusions.forEach((exclusion) => {
            const result = this.regular.addExclusionsGroup(exclusion);
            if (result) {
                addedExclusions += 1;
            }
        });
        return addedExclusions;
    }

    // TODO: handle adding to exclusions (ip case)
    addSelectiveExclusions(exclusions) {
        let addedExclusions = 0;
        exclusions.forEach((exclusion) => {
            const result = this.selective.addExclusionsGroup(exclusion);
            if (result) {
                addedExclusions += 1;
            }
        });
        return addedExclusions;
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

    // TODO: enable vpn by url
    // eslint-disable-next-line no-unused-vars
    async enableVpnByUrl(url) {
        if (this.inverted) {
            // await this.currentHandler.addToExclusions(url);
        } else {
            // await this.currentHandler.disableExclusionByUrl(url);
        }
    }

    // TODO: disable vpn by url
    // eslint-disable-next-line no-unused-vars
    async disableVpnByUrl(url) {
        if (this.inverted) {
            // await this.currentHandler.disableExclusionByUrl(url);
        } else {
            // await this.currentHandler.addToExclusions(url);
        }
    }

    /**
     * Checks if vpn is enabled for url
     * If this function is called when currentHandler is not set yet it returns true
     * @param url
     * @returns {boolean}
     */
    isVpnEnabledByUrl(url) {
        if (!this.currentHandler) {
            return true;
        }
        const isExcluded = this.currentHandler.isExcluded(url);
        return this.inverted ? isExcluded : !isExcluded;
    }

    isInverted() {
        return this.inverted;
    }
}

export default Exclusions;
