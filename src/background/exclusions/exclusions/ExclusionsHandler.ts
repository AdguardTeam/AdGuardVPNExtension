import { nanoid } from 'nanoid';

import { ExclusionsMode, ExclusionState } from '../../../common/exclusionsConstants';
import { areHostnamesEqual, shExpMatch } from '../../../lib/string-utils';
import { ExclusionInterface, IndexedExclusionsInterface } from './exclusionsTypes';
import { getETld, getHostname } from '../../../common/url-utils';

interface UpdateHandler {
    (): Promise<void>;
}

export interface AddExclusionArgs {
    value: string,
    enabled?: boolean,
    overwriteState?: boolean
}

export class ExclusionsHandler {
    exclusions: ExclusionInterface[];

    exclusionsIndex: IndexedExclusionsInterface;

    updateHandler: UpdateHandler;

    public mode: ExclusionsMode;

    constructor(
        updateHandler: UpdateHandler,
        exclusions: ExclusionInterface[],
        mode: ExclusionsMode,
    ) {
        this.updateHandler = updateHandler;
        this.exclusions = exclusions;
        this.exclusionsIndex = ExclusionsHandler.buildExclusionsIndex(exclusions);
        this.mode = mode;
    }

    async onUpdate() {
        this.exclusionsIndex = ExclusionsHandler.buildExclusionsIndex(this.exclusions);
        await this.updateHandler();
    }

    getExclusions(): ExclusionInterface[] {
        return this.exclusions;
    }

    async setExclusions(exclusions: ExclusionInterface[]) {
        this.exclusions = exclusions;
        await this.onUpdate();
    }

    getIndexedExclusions(): IndexedExclusionsInterface {
        return this.exclusionsIndex;
    }

    /**
     * Creates exclusions index for provided exclusions
     * @param exclusions
     */
    public static buildExclusionsIndex(exclusions: ExclusionInterface[])
        : IndexedExclusionsInterface {
        const indexedExclusions = exclusions.reduce((
            acc: IndexedExclusionsInterface,
            exclusion,
        ) => {
            let domain = getETld(exclusion.hostname);

            if (!domain) {
                domain = exclusion.hostname;
            }

            if (acc[domain]) {
                acc[domain].push(exclusion.id);
            } else {
                acc[domain] = [exclusion.id];
            }
            return acc;
        }, {});

        return indexedExclusions;
    }

    /**
     * Adds prepared exclusions and returns amount of added
     * @param exclusionsToAdd
     */
    async addExclusions(exclusionsToAdd: AddExclusionArgs[]): Promise<number> {
        let addedCount = 0;
        exclusionsToAdd.forEach(({ value, enabled = true, overwriteState = false }) => {
            const state = enabled ? ExclusionState.Enabled : ExclusionState.Disabled;
            const existingIndex = this.exclusions.findIndex((ex) => ex.hostname === value);
            if (existingIndex > -1) {
                if (overwriteState) {
                    this.exclusions[existingIndex].state = state;
                }
            } else {
                this.exclusions.push({ id: nanoid(), hostname: value, state });
                addedCount += 1;
            }
        });

        await this.onUpdate();
        return addedCount;
    }

    hasETld = (eTld: string) => {
        return !!this.exclusionsIndex[eTld];
    };

    /**
     * Adds exclusion by provided url
     * @param url
     */
    async addUrlToExclusions(url: string) {
        const hostname = getHostname(url);

        if (!hostname) {
            return;
        }

        this.exclusions.push({ id: nanoid(), hostname, state: ExclusionState.Enabled });

        await this.onUpdate();
    }

    /**
     * Returns exclusions by provided hostname
     * @param hostname
     */
    getExclusionByHostname(hostname: string): ExclusionInterface | undefined {
        return this.exclusions
            .find((exclusion) => areHostnamesEqual(hostname, exclusion.hostname));
    }

    /**
     * Enables exclusion by provided id
     * @param id
     */
    async enableExclusion(id: string) {
        this.exclusions = this.exclusions.map((ex) => {
            if (ex.id === id) {
                return {
                    ...ex,
                    state: ExclusionState.Enabled,
                };
            }
            return ex;
        });

        await this.onUpdate();
    }

    /**
     * Removes exclusions by provided ids
     * @param ids
     */
    async removeExclusions(ids: string[]) {
        this.exclusions = this.exclusions.filter((exclusion) => {
            return !ids.includes(exclusion.id);
        });

        await this.onUpdate();
    }

    /**
     * Sets provided state for exclusions with ids
     * @param ids
     * @param state
     */
    async setExclusionsState(
        ids: string[],
        state: Exclude<ExclusionState, ExclusionState.PartlyEnabled>,
    ) {
        this.exclusions = this.exclusions.map((ex) => {
            if (ids.includes(ex.id)) {
                return {
                    ...ex,
                    state,
                };
            }
            return ex;
        });

        await this.onUpdate();
    }

    /**
     * Disables exclusion by url
     * @param url
     */
    async disableExclusionByUrl(url: string) {
        const hostname = getHostname(url);
        if (!hostname) {
            return;
        }

        const exclusion = this.getExclusionByHostname(hostname);
        if (!exclusion) {
            return;
        }

        await this.setExclusionsState([exclusion.id], ExclusionState.Disabled);
        await this.onUpdate();
    }

    /**
     * Removes exclusions data
     */
    async clearExclusionsData() {
        this.exclusions = [];

        await this.onUpdate();
    }

    /**
     * Returns exclusion by url
     * @param url
     * @param includeWildcards
     */
    getExclusionsByUrl = (url: string, includeWildcards = true) => {
        const hostname = getHostname(url);
        if (!hostname) {
            return undefined;
        }
        return this.exclusions
            .filter((exclusion) => areHostnamesEqual(hostname, exclusion.hostname)
                || (includeWildcards && shExpMatch(hostname, exclusion.hostname)));
    };

    /**
     * Checks provided url is excluded
     * @param url
     */
    isExcluded = (url: string): boolean => {
        if (!url) {
            return false;
        }

        const exclusions = this.getExclusionsByUrl(url);

        if (!exclusions) {
            return false;
        }

        return exclusions.some((exclusion) => exclusion.state === ExclusionState.Enabled);
    };
}
