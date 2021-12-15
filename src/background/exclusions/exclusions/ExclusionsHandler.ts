import { nanoid } from 'nanoid';
import { getDomain } from 'tldts';
import ipaddr from 'ipaddr.js';

import { ExclusionsModes, ExclusionStates } from '../../../common/exclusionsConstants';
import { getHostname } from '../../../lib/helpers';
// FIXME interfaces to common directory to solve cycle dependency
// eslint-disable-next-line import/no-cycle
import { ExclusionInterface, IndexedExclusionsInterface } from './ExclusionsManager';
import { areHostnamesEqual, shExpMatch } from '../../../lib/string-utils';

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

interface UpdateHandler {
    (): void;
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
        this.exclusionsIndex = this.getExclusionsIndex(exclusions);
        this.mode = mode;
    }

    getExclusions(): ExclusionInterface[] {
        return this.exclusions;
    }

    getIndexedExclusions(): IndexedExclusionsInterface {
        return this.exclusionsIndex;
    }

    getExclusionsIndex(exclusions: ExclusionInterface[]) {
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

    async addExclusions(hostnames: string[]) {
        hostnames.forEach((hostname) => {
            this.exclusions.push({ id: nanoid(), hostname, state: ExclusionStates.Enabled });
        });

        this.exclusionsIndex = this.getExclusionsIndex(this.exclusions);

        await this.updateHandler();
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
        this.exclusionsIndex = this.getExclusionsIndex(this.exclusions);

        await this.updateHandler();
    }

    async removeExclusions(ids: string[]) {
        this.exclusions = this.exclusions.filter((exclusion) => {
            return !ids.includes(exclusion.id);
        });

        this.exclusionsIndex = this.getExclusionsIndex(this.exclusions);
        await this.updateHandler();
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

        this.exclusionsIndex = this.getExclusionsIndex(this.exclusions);
        await this.updateHandler();
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

        await this.updateHandler();
    }

    async clearExclusionsData() {
        this.exclusions = [];
        await this.updateHandler();
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
