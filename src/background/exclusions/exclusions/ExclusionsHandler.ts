import { nanoid } from 'nanoid';

import { type ExclusionsMode, ExclusionState } from '../../../common/exclusionsConstants';
import { areHostnamesEqual, shExpMatch } from '../../../common/utils/string';
import { getETld, getHostname, getSubdomain } from '../../../common/utils/url';
import type { ExclusionInterface, IndexedExclusionsInterface } from '../../schema';

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

    async onUpdate(): Promise<void> {
        this.exclusionsIndex = ExclusionsHandler.buildExclusionsIndex(this.exclusions);
        await this.updateHandler();
    }

    async setExclusions(exclusions: ExclusionInterface[]): Promise<void> {
        this.exclusions = exclusions;
        await this.onUpdate();
    }

    getIndexedExclusions(): IndexedExclusionsInterface {
        return this.exclusionsIndex;
    }

    /**
     * Creates exclusions index for provided exclusions.
     *
     * @param exclusions
     *
     * @returns Exclusions index.
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
     * Adds prepared exclusions and returns amount of added.
     *
     * @param exclusionsToAdd
     *
     * @returns Promise with amount of added exclusions.
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

    hasETld = (eTld: string): boolean => {
        return !!this.exclusionsIndex[eTld];
    };

    /**
     * Adds exclusion by provided url
     * @param url
     */
    async addUrlToExclusions(url: string): Promise<void> {
        const hostname = getHostname(url);

        if (!hostname) {
            return;
        }

        this.exclusions.push({ id: nanoid(), hostname, state: ExclusionState.Enabled });

        await this.onUpdate();
    }

    /**
     * Gets exclusions by provided hostname.
     *
     * @param hostname
     *
     * @returns Exclusion or undefined if not found.
     */
    getExclusionByHostname(hostname: string): ExclusionInterface | undefined {
        return this.exclusions
            .find((exclusion) => areHostnamesEqual(hostname, exclusion.hostname));
    }

    /**
     * Enables exclusion by provided id
     * @param id
     */
    async enableExclusion(id: string): Promise<void> {
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
    async removeExclusions(ids: string[]): Promise<void> {
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
    ): Promise<void> {
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
     * Disables state for provided exclusion
     * @param exclusion
     */
    async disableExclusionState(exclusion: ExclusionInterface): Promise<void> {
        await this.setExclusionsState([exclusion.id], ExclusionState.Disabled);
    }

    /**
     * Disables exclusion by url
     * @param url
     */
    async disableExclusionByUrl(url: string): Promise<void> {
        const hostname = getHostname(url);
        if (!hostname) {
            return;
        }

        const hostnameExclusion = this.getExclusionByHostname(hostname);
        if (hostnameExclusion) {
            await this.disableExclusionState(hostnameExclusion);
            return;
        }

        const eTld = getETld(url);
        if (!eTld) {
            return;
        }

        const subdomain = getSubdomain(hostname, eTld);

        if (subdomain.length) {
            const subdomainExclusion = this.getExclusionByHostname(hostname);
            // disable existing subdomain exclusion
            if (subdomainExclusion) {
                await this.disableExclusionState(subdomainExclusion);
                return;
            }

            // if there is no existing subdomain exclusion,
            // disable wildcard exclusion
            const wildcardExclusion = this.getExclusionByHostname(`*.${eTld}`);
            if (wildcardExclusion) {
                await this.disableExclusionState(wildcardExclusion);
            }
        }
    }

    /**
     * Removes exclusions data
     */
    async clearExclusionsData(): Promise<void> {
        this.exclusions = [];

        await this.onUpdate();
    }

    /**
     * Gets exclusion by url.
     *
     * @param url
     * @param includeWildcards
     *
     * @returns Exclusions or undefined if not found.
     */
    getExclusionsByUrl = (url: string, includeWildcards = true): ExclusionInterface[] | undefined => {
        const hostname = getHostname(url);
        if (!hostname) {
            return undefined;
        }
        return this.exclusions
            .filter((exclusion) => areHostnamesEqual(hostname, exclusion.hostname)
                || (includeWildcards && shExpMatch(hostname, exclusion.hostname)));
    };

    /**
     * Checks provided url is excluded.
     *
     * @param url
     *
     * @returns True if url is excluded, false otherwise.
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
