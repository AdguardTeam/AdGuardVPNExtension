import { nanoid } from 'nanoid';
import { getDomain } from 'tldts';
import ipaddr from 'ipaddr.js';

import { ExclusionsModes, ExclusionStates } from '../../../common/exclusionsConstants';
import { getHostname } from '../../../lib/helpers';
import { areHostnamesEqual, shExpMatch } from '../../../lib/string-utils';
import { ExclusionInterface, IndexedExclusionsInterface } from './exclusionsTypes';

/**
 * Here eTld means eTLD + 1
 */
export const getETld = (hostname: string) => {
    const SEPARATOR = '.';

    if (ipaddr.isValid(hostname)) {
        return hostname;
    }

    const parts = hostname.split(SEPARATOR);
    let domainParts = parts.splice(parts.length - 2, 2);
    const domain = getDomain(domainParts.join(SEPARATOR));
    if (domain) {
        return domain;
    }

    while (parts.length > 0) {
        const nextPart = parts.pop();
        if (nextPart) {
            domainParts = [nextPart, ...domainParts];
        }

        const domain = getDomain(domainParts.join(SEPARATOR));
        if (domain) {
            return domain;
        }
    }

    return null;
};

export const getSubdomain = (hostname: string, eTld: string) => {
    // TODO use regular expression to get subdomain
    return hostname
        .replace(eTld, '')
        .replace('www.', '');
};

interface UpdateHandler {
    (): Promise<void>;
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
        this.exclusionsIndex = ExclusionsHandler.getExclusionsIndex(exclusions);
        this.mode = mode;
    }

    async onUpdate() {
        this.exclusionsIndex = ExclusionsHandler.getExclusionsIndex(this.exclusions);
        await this.updateHandler();
    }

    getExclusions(): ExclusionInterface[] {
        return this.exclusions;
    }

    getIndexedExclusions(): IndexedExclusionsInterface {
        return this.exclusionsIndex;
    }

    public static getExclusionsIndex(exclusions: ExclusionInterface[]) {
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

    async addExclusions(exclusionsToAdd: {
        value: string,
        enabled?: boolean,
    }[]) {
        exclusionsToAdd.forEach(({ value, enabled = true }) => {
            const state = enabled ? ExclusionStates.Enabled : ExclusionStates.Disabled;
            this.exclusions.push({ id: nanoid(), hostname: value, state });
        });

        await this.onUpdate();
    }

    hasETld = (eTld: string) => {
        return !!this.exclusionsIndex[eTld];
    };

    async addUrlToExclusions(url: string) {
        const hostname = getHostname(url);

        if (!hostname) {
            return;
        }

        this.exclusions.push({ id: nanoid(), hostname, state: ExclusionStates.Enabled });

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
                    state: ExclusionStates.Enabled,
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

    async setExclusionsState(ids: string[], state: ExclusionStates) {
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

        return exclusions.some((exclusion) => exclusion.state === ExclusionStates.Enabled);
    };
}
