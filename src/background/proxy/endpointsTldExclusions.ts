import throttle from 'lodash/throttle';
import isEqual from 'lodash/isEqual';
import sortBy from 'lodash/sortBy';

import { log } from '../../common/logger';
import { browserApi } from '../browserApi';
import { StorageKey } from '../schema';
import { StateData } from '../stateStorage';

import { proxy } from './index';

/**
 * This module manages exclusions for endpoints
 * We use it in order to make requests to our endpoints (e.g. to determine ping)
 * bypassing enabled proxy
 *
 * In this module tld means tld + 1 (e.g. for "endpoint.adguard.io" tld would be "adguard.io" )
 */
class EndpointsTldExclusions {
    /**
     * Endpoints TLD Exclusions service state data.
     * Used to save and retrieve endpoints TLD exclusions state from session storage,
     * in order to persist it across service worker restarts.
     */
    private endpointsTldExclusionsState = new StateData(StorageKey.EndpointsTldExclusions);

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
     * Updates storage in a throttled way
     */
    updateStorage = throttle(async () => {
        try {
            const { endpointsTldExclusionsList } = await this.endpointsTldExclusionsState.get();
            await browserApi.storage.set(this.STORAGE_KEY, endpointsTldExclusionsList);
            log.debug('Endpoints tld exclusions saved in the storage');
        } catch (e) {
            log.error(e);
        }
    }, this.THROTTLE_TIMEOUT_MS);

    /**
     * Adds endpoints tld exclusions
     * @param endpointsTlds - list of second level domains parsed from the endpoints
     */
    addEndpointsTldExclusions = async (endpointsTlds: string[]): Promise<void> => {
        const endpointsTldExclusions = this.convertEndpointTldToExclusion(endpointsTlds);

        await this.handleEndpointsTldExclusionsListUpdate(endpointsTldExclusions);
    };

    /**
     * Converts endpoints tld to exclusion
     *
     * @param endpointsTlds - endpoints top level domains
     *
     * @returns List of exclusions.
     */
    convertEndpointTldToExclusion = (endpointsTlds: string[]): string[] => {
        const endpointsTldExclusions = endpointsTlds.map((endpointTld) => {
            const endpointTldExclusion = `*.${endpointTld}`;
            return endpointTldExclusion;
        });
        return endpointsTldExclusions;
    };

    /**
     * Updates endpoints top level domains if necessary and notifies proxy to generate new pac file.
     *
     * @param endpointsTldExclusions
     */
    handleEndpointsTldExclusionsListUpdate = async (endpointsTldExclusions: string[]): Promise<void> => {
        let { endpointsTldExclusionsList } = await this.endpointsTldExclusionsState.get();

        // if lists have same values, do nothing
        if (isEqual(
            sortBy(endpointsTldExclusionsList),
            sortBy(endpointsTldExclusions),
        )) {
            return;
        }

        endpointsTldExclusionsList = endpointsTldExclusions;
        await this.endpointsTldExclusionsState.update({ endpointsTldExclusionsList });

        this.updateStorage();
        await proxy.setEndpointsTldExclusions(endpointsTldExclusionsList);
    };

    init = async (): Promise<void> => {
        try {
            const storedList = await browserApi.storage.get<string[]>(this.STORAGE_KEY);
            if (storedList) {
                await this.endpointsTldExclusionsState.update({ endpointsTldExclusionsList: storedList });
                await proxy.setEndpointsTldExclusions(storedList);
            }
        } catch (e) {
            log.error(e);
        }
        log.debug('Endpoints tld exclusions module initiated');
    };
}

export const endpointsTldExclusions = new EndpointsTldExclusions();
