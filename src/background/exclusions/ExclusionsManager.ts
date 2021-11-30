import { ExclusionsHandler, ExclusionsData } from './ExclusionsHandler';
import { log } from '../../lib/logger';
import notifier from '../../lib/notifier';
import { ExclusionsGroup } from './ExclusionsGroup';
import { Exclusion } from './Exclusion';
import { Service } from './Service';
import { ExclusionsModes, ExclusionStates } from '../../common/exclusionsConstants';

interface ExclusionsInfo {
    inverted: boolean,
    [ExclusionsModes.Selective]: {
        excludedServices: Service[],
        exclusionsGroups: ExclusionsGroup[],
        excludedIps: Exclusion[],
    },
    [ExclusionsModes.Regular]: {
        excludedServices: Service[],
        exclusionsGroups: ExclusionsGroup[],
        excludedIps: Exclusion[],
    },
}

class ExclusionsManager implements ExclusionsInfo {
    browser: any;

    proxy: any;

    settings: any;

    MODES = ExclusionsModes;

    exclusions: ExclusionsInfo;

    inverted: boolean;

    regularModeHandler: ExclusionsHandler;

    selectiveModeHandler: ExclusionsHandler;

    currentHandler: ExclusionsHandler;

    constructor(browser: {}, proxy: {}, settings: {}) {
        this.browser = browser;
        this.proxy = proxy;
        this.settings = settings;
    }

    init = async () => {
        this.exclusions = this.settings.getExclusions() || {};

        const selective = this.exclusions?.[this.MODES.Selective] ?? {
            excludedServices: [],
            exclusionsGroups: [],
            excludedIps: [],
        };
        const regular = this.exclusions?.[this.MODES.Regular] ?? {
            excludedServices: [],
            exclusionsGroups: [],
            excludedIps: [],
        };

        this.inverted = this.exclusions?.inverted ?? false;

        this.selectiveModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            selective,
            this.MODES.Selective,
        );

        this.regularModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            regular,
            this.MODES.Regular,
        );

        this.currentHandler = this.inverted ? this.selectiveModeHandler : this.regularModeHandler;
        // update bypass list in proxy on init
        await this.handleExclusionsUpdate();

        // @ts-ignore
        notifier.addSpecifiedListener(notifier.types.NON_ROUTABLE_DOMAIN_ADDED, (payload) => {
            if (this.currentHandler.mode === this.MODES.Regular) {
                this.currentHandler.addUrlToExclusions(payload);
            }
        });

        log.info('ExclusionsHandler list is ready');
    };

    handleExclusionsUpdate = async () => {
        // @ts-ignore
        notifier.notifyListeners(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE);

        const exclusionsData = this.current.getExclusions();
        const enabledExclusionsList = this.getEnabledExclusionsHostnames(exclusionsData);

        await this.proxy.setBypassList(enabledExclusionsList, this.inverted);

        const exclusionsRepository = {
            inverted: this.inverted,
            [this.MODES.Selective]: {
                excludedServices: this.selective.excludedServices,
                exclusionsGroups: this.selective.exclusionsGroups,
                excludedIps: this.selective.excludedIps,
            },
            [this.MODES.Regular]: {
                excludedServices: this.regular.excludedServices,
                exclusionsGroups: this.regular.exclusionsGroups,
                excludedIps: this.regular.excludedIps,
            },
        };

        this.settings.setExclusions(exclusionsRepository);
    };

    getEnabledExclusionsHostnames(exclusionsData: ExclusionsData): string[] {
        // TODO refactor
        const enabledServicesHostnames = exclusionsData.excludedServices.map((service: Service) => {
            return service.exclusionsGroups.filter((group) => {
                return (service.state === ExclusionStates.Enabled
                    || service.state === ExclusionStates.PartlyEnabled)
                        && (group.state === ExclusionStates.Enabled
                            || group.state === ExclusionStates.PartlyEnabled)
                        && group.exclusions.filter(({ enabled }) => enabled);
            }).map(({ exclusions }) => exclusions.map(({ hostname }) => hostname));
        });

        const enabledGroupsHostnames = exclusionsData.exclusionsGroups
            .map((group: ExclusionsGroup) => {
                return group.exclusions.filter((exclusion) => {
                    return (group.state === ExclusionStates.Enabled
                        || group.state === ExclusionStates.PartlyEnabled)
                            && exclusion.enabled;
                }).map(({ hostname }) => hostname);
            });

        const enabledIps = exclusionsData.excludedIps
            .filter(({ enabled }) => enabled)
            .map(({ hostname }) => hostname);

        return [
            ...enabledServicesHostnames,
            ...enabledGroupsHostnames,
            ...enabledIps,
        ].flat(2);
    }

    async setCurrentMode(mode: ExclusionsModes) {
        switch (mode) {
            case this.MODES.Selective: {
                this.currentHandler = this.selectiveModeHandler;
                this.inverted = true;
                break;
            }
            case this.MODES.Regular: {
                this.currentHandler = this.regularModeHandler;
                this.inverted = false;
                break;
            }
            default:
                throw Error(`Wrong type received ${mode}`);
        }
        await this.handleExclusionsUpdate();
    }

    getHandler(mode: ExclusionsModes) {
        switch (mode) {
            case this.MODES.Selective: {
                return this.selective;
            }
            case this.MODES.Regular: {
                return this.regular;
            }
            default:
                throw Error(`Wrong mode requested: ${mode}`);
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

    // TODO: enable vpn by url
    // // eslint-disable-next-line no-unused-vars
    // async enableVpnByUrl(url: string) {
    //     if (this.inverted) {
    //         // await this.currentHandler.addToExclusions(url);
    //     } else {
    //         // await this.currentHandler.disableExclusionByUrl(url);
    //     }
    // }

    // TODO: disable vpn by url
    // // eslint-disable-next-line no-unused-vars
    // async disableVpnByUrl(url: string) {
    //     if (this.inverted) {
    //         // await this.currentHandler.disableExclusionByUrl(url);
    //     } else {
    //         // await this.currentHandler.addToExclusions(url);
    //     }
    // }

    /**
     * Checks if vpn is enabled for url
     * If this function is called when currentHandler is not set yet it returns true
     * @param url
     * @returns {boolean}
     */
    isVpnEnabledByUrl(url: string) {
        if (!this.currentHandler) {
            return true;
        }
        const isExcluded = this.currentHandler.isExcluded(url);
        return this.inverted ? isExcluded : !isExcluded;
    }

    isInverted() {
        return this.inverted;
    }

    async clearExclusions() {
        await this.regular.clearExclusionsData();
        await this.selective.clearExclusionsData();
        const emptyExclusions = {
            inverted: this.inverted,
            [this.MODES.Selective]: {
                excludedServices: [],
                exclusionsGroups: [],
                excludedIps: [],
            },
            [this.MODES.Regular]: {
                excludedServices: [],
                exclusionsGroups: [],
                excludedIps: [],
            },
        };
        this.settings.setExclusions(emptyExclusions);
    }

    async importExclusionsData(exclusionsData) {
        try {
            exclusionsData.forEach((entry) => {
                let entryData;
                if (entry.content[0] === '{') {
                    entryData = JSON.parse(entry.content);
                } else {
                    entryData = entry.content.split('\n');
                }
                if (entry.type === ExclusionsModes.Regular) {
                    this.regular.importExclusionsData(entryData);
                }
                if (entry.type === ExclusionsModes.Selective) {
                    this.selective.importExclusionsData(entryData);
                }
            });
        } catch (e: any) {
            throw new Error(`Unable to import exclusions data due to the error: ${e.message}`);
        }
        await this.handleExclusionsUpdate();
    }
}

export default ExclusionsManager;
