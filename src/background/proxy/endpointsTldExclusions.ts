import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';

import { log } from '../../lib/logger';
import { browserApi } from '../browserApi';
import { proxy } from './index';
import { StorageKey } from '../schema';
import { sessionState } from '../sessionStorage';

/**
 * This module manages exclusions for endpoints
 * We use it in order to make requests to our endpoints (e.g. to determine ping)
 * bypassing enabled proxy
 *
 * In this module tld means tld + 1 (e.g. for "endpoint.adguard.io" tld would be "adguard.io" )
 */
class EndpointsTldExclusions {
    /**
     * !!!IMPORTANT!!! do not change this key without migration
     * Storage key used to keep exclusions in the storage
     * @type {string}
     */
    STORAGE_KEY = 'endpoints.tld.exclusions';

    /**
     * Throttle timeout used to reduce writes to the storage
     * @type {number}
     */
    THROTTLE_TIMEOUT_MS = 1000;

    /**
     * Endpoints top level domain exclusions list
     */
    private get endpointsTldExclusionsList(): string[] {
        return sessionState.getItem(StorageKey.EndpointsTldExclusions).endpointsTldExclusionsList;
    }

    private set endpointsTldExclusionsList(endpointsTldExclusionsList: string[]) {
        const endpointsTldExclusionsState = sessionState.getItem(StorageKey.EndpointsTldExclusions);
        endpointsTldExclusionsState.endpointsTldExclusionsList = endpointsTldExclusionsList;
        sessionState.setItem(StorageKey.EndpointsTldExclusions, endpointsTldExclusionsState);
    }

    /**
     * Updates storage in a throttled way
     */
    updateStorage = throttle(async () => {
        try {
            await browserApi.storage.set(this.STORAGE_KEY, this.endpointsTldExclusionsList);
            log.debug('Endpoints tld exclusions saved in the storage');
        } catch (e) {
            log.error(e);
        }
    }, this.THROTTLE_TIMEOUT_MS);

    /**
     * Adds endpoints tld exclusions
     * @param endpointsTlds - list of second level domains parsed from the endpoints
     */
    addEndpointsTldExclusions = async (endpointsTlds: string[]) => {
        const endpointsTldExclusions = this.convertEndpointTldToExclusion(endpointsTlds);

        await this.handleEndpointsTldExclusionsListUpdate(endpointsTldExclusions);
    };

    /**
     * Converts endpoints tld to exclusion
     * @param endpointsTlds - endpoints top level domains
     */
    convertEndpointTldToExclusion = (endpointsTlds: string[]) => {
        const endpointsTldExclusions = endpointsTlds.map((endpointTld) => {
            const endpointTldExclusion = `*.${endpointTld}`;
            return endpointTldExclusion;
        });
        return endpointsTldExclusions;
    };

    /**
     * Updates endpoints top level domains if necessary and notifies proxy to generate new pac file
     * @param endpointsTldExclusions
     */
    handleEndpointsTldExclusionsListUpdate = async (endpointsTldExclusions: string[]) => {
        // if lists have same values, do nothing
        if (isEqual(
            sortBy(this.endpointsTldExclusionsList),
            sortBy(endpointsTldExclusions),
        )) {
            return;
        }

        this.endpointsTldExclusionsList = endpointsTldExclusions;

        this.updateStorage();
        await proxy.setEndpointsTldExclusions(this.endpointsTldExclusionsList);
    };

    init = async () => {
        try {
            const storedList = await browserApi.storage.get<string[]>(this.STORAGE_KEY);
            if (storedList) {
                this.endpointsTldExclusionsList = storedList;
                await proxy.setEndpointsTldExclusions(this.endpointsTldExclusionsList);
            }
        } catch (e) {
            log.error(e);
        }
        log.debug('Endpoints tld exclusions module initiated');
    };
}

export const endpointsTldExclusions = new EndpointsTldExclusions();
