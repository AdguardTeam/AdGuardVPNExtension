import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';

import { log } from '../../lib/logger';
import browserApi from '../browserApi';
import { proxy } from './index';

interface EndpointsTldExclusionsInterface {
    init(): Promise<void>;
    addEndpointsTldExclusions(endpointsTlds: string[]): void;
}

/**
 * This module manages exclusions for endpoints
 * We use it in order to make requests to our endpoints (e.g. to determine ping)
 * bypassing enabled proxy
 *
 * In this module tld means tld + 1 (e.g. for "endpoint.adguard.io" tld would be "adguard.io" )
 */
class EndpointsTldExclusions implements EndpointsTldExclusionsInterface {
    /**
     * !!!IMPORTANT!!! do not change this key without migration
     * Storage key used to keep exclusions in the storage
     */
    STORAGE_KEY: string = 'endpoints.tld.exclusions';

    /**
     * Throttle timeout used to reduce writes to the storage
     */
    THROTTLE_TIMEOUT_MS: number = 1000;

    /**
     * Endpoints top level domain exclusions list
     */
    endpointsTldExclusionsList: string[] = [];

    /**
     * Updates storage in a throttled way
     * @type {(function(): Promise<void>) & Cancelable}
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
     * @param {string[]} endpointsTlds - list of second level domains parsed from the endpoints
     */
    addEndpointsTldExclusions = (endpointsTlds: string[]): void => {
        const endpointsTldExclusions = this.convertEndpointTldToExclusion(endpointsTlds);

        this.handleEndpointsTldExclusionsListUpdate(endpointsTldExclusions);
    };

    /**
     * Converts endpoints tld to exclusion
     * @param {string[]} endpointsTlds - endpoints top level domains
     * @returns {string[]}
     */
    convertEndpointTldToExclusion = (endpointsTlds: string[]): string[] => {
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
    handleEndpointsTldExclusionsListUpdate = (endpointsTldExclusions: string[]) => {
        // if lists have same values, do nothing
        if (isEqual(
            sortBy(this.endpointsTldExclusionsList),
            sortBy(endpointsTldExclusions),
        )) {
            return;
        }

        this.endpointsTldExclusionsList = endpointsTldExclusions;

        this.updateStorage();
        proxy.setEndpointsTldExclusions(this.endpointsTldExclusionsList);
    };

    init = async (): Promise<void> => {
        try {
            const storedList = await browserApi.storage.get(this.STORAGE_KEY);
            if (storedList) {
                this.endpointsTldExclusionsList = storedList;
                proxy.setEndpointsTldExclusions(this.endpointsTldExclusionsList);
            }
        } catch (e) {
            log.error(e);
        }
        log.debug('Endpoints tld exclusions module initiated');
    };
}

const endpointsTldExclusions = new EndpointsTldExclusions();

export { endpointsTldExclusions };
