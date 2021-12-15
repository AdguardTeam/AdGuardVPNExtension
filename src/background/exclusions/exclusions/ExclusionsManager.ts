import { ExclusionsModes, ExclusionStates } from '../../../common/exclusionsConstants';
// FIXME remove cycle dependency
// eslint-disable-next-line import/no-cycle
import { ExclusionsHandler } from './ExclusionsHandler';
import notifier from '../../../lib/notifier';
import { log } from '../../../lib/logger';
import { settings } from '../../settings';
import { proxy } from '../../proxy';

export interface ExclusionsDataToImport {
    type: string,
    content: string,
}

export interface IndexedExclusionsInterface {
    [id: string]: string[];
}

export interface ExclusionInterface {
    id: string,
    hostname: string,
    state: ExclusionStates,
}

interface PersistedExclusions {
    [ExclusionsModes.Regular]: ExclusionInterface[];
    [ExclusionsModes.Selective]: ExclusionInterface[];
    inverted: boolean;
}

const DefaultExclusions: PersistedExclusions = {
    [ExclusionsModes.Regular]: [],
    [ExclusionsModes.Selective]: [],
    inverted: false,
};

export class ExclusionsManager {
    exclusions: PersistedExclusions = DefaultExclusions;

    inverted: boolean = DefaultExclusions.inverted;

    selectiveModeHandler: ExclusionsHandler;

    regularModeHandler: ExclusionsHandler;

    currentHandler: ExclusionsHandler;

    init = async () => {
        this.exclusions = settings.getExclusions() as PersistedExclusions;

        const regular = this.exclusions[ExclusionsModes.Regular] ?? [];

        const selective = this.exclusions[ExclusionsModes.Selective] ?? [];

        this.inverted = this.exclusions.inverted ?? false;

        this.selectiveModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            selective,
            ExclusionsModes.Selective,
        );

        this.regularModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            regular,
            ExclusionsModes.Regular,
        );

        this.currentHandler = this.inverted ? this.selectiveModeHandler : this.regularModeHandler;

        // update bypass list in proxy on init
        await this.handleExclusionsUpdate();

        // @ts-ignore
        notifier.addSpecifiedListener(notifier.types.NON_ROUTABLE_DOMAIN_ADDED, (payload) => {
            if (this.currentHandler.mode === ExclusionsModes.Regular) {
                this.currentHandler.addUrlToExclusions(payload);
            }
        });

        log.info('ExclusionsManager is ready');
    };

    handleExclusionsUpdate = async () => {
        // @ts-ignore
        notifier.notifyListeners(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE);

        const exclusionsData = this.getExclusions();
        const enabledExclusionsList = exclusionsData.map((exclusion) => {
            if (exclusion.state === ExclusionStates.Enabled) {
                return exclusion.hostname;
            }
        })

        await proxy.setBypassList(enabledExclusionsList, this.inverted);

        const exclusionsRepository = {
            inverted: this.inverted,
            [ExclusionsModes.Selective]: this.selective.exclusions,
            [ExclusionsModes.Regular]: this.regular.exclusions,
        };

        settings.setExclusions(exclusionsRepository);
    };

    get regular() {
        return this.regularModeHandler;
    }

    get selective() {
        return this.selectiveModeHandler;
    }

    get current() {
        return this.currentHandler;
    }

    async setCurrentMode(mode: ExclusionsModes) {
        switch (mode) {
            case ExclusionsModes.Selective: {
                this.currentHandler = this.selectiveModeHandler;
                this.inverted = true;
                break;
            }
            case ExclusionsModes.Regular: {
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
            case ExclusionsModes.Selective: {
                return this.selective;
            }
            case ExclusionsModes.Regular: {
                return this.regular;
            }
            default:
                throw Error(`Wrong mode requested: ${mode}`);
        }
    }

    async enableVpnByUrl(url: string) {
        if (this.inverted) {
            await this.currentHandler.addUrlToExclusions(url);
        } else {
            await this.currentHandler.disableExclusionByUrl(url);
        }
    }

    async disableVpnByUrl(url: string) {
        if (this.inverted) {
            await this.currentHandler.disableExclusionByUrl(url);
        } else {
            await this.currentHandler.addUrlToExclusions(url);
        }
    }

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
        const isExcluded = this.currentHandler.isExcludedByUrl(url);
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
            [ExclusionsModes.Selective]: [],
            [ExclusionsModes.Regular]: [],
        };
        settings.setExclusions(emptyExclusions);
    }

    async importExclusionsData(exclusionsData: ExclusionsDataToImport[]) {
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

    getExclusions(): ExclusionInterface[] {
        return this.currentHandler.getExclusions();
    }

    getIndexedExclusions(): IndexedExclusionsInterface {
        return this.currentHandler.getIndexedExclusions();
    }
}

export const exclusionsManager = new ExclusionsManager();
