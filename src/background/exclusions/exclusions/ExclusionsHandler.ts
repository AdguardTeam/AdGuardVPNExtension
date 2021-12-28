import { nanoid } from 'nanoid';

import { ExclusionsModes, ExclusionState } from '../../../common/exclusionsConstants';
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

    public mode: ExclusionsModes;

    constructor(
        updateHandler: UpdateHandler,
        exclusions: ExclusionInterface[],
        mode: ExclusionsModes,
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

    getIndexedExclusions(): IndexedExclusionsInterface {
        return this.exclusionsIndex;
    }

    public static buildExclusionsIndex(exclusions: ExclusionInterface[]) {
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

    async addUrlToExclusions(url: string) {
        const hostname = getHostname(url);

        if (!hostname) {
            return;
        }

        this.exclusions.push({ id: nanoid(), hostname, state: ExclusionState.Enabled });

        await this.onUpdate();
    }

    getExclusionByHostname(hostname: string) {
        return this.exclusions
            .find((exclusion) => areHostnamesEqual(hostname, exclusion.hostname));
    }

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

    async removeExclusions(ids: string[]) {
        this.exclusions = this.exclusions.filter((exclusion) => {
            return !ids.includes(exclusion.id);
        });

        await this.onUpdate();
    }

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

        await this.onUpdate();
    }

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

    isExcluded = (url: string) => {
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
