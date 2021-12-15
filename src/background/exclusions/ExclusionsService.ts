import ipaddr from 'ipaddr.js';

import { exclusionsManager } from './exclusions/ExclusionsManager';
import { servicesManager } from './services/ServicesManager';
import { ExclusionsTree } from './ExclusionsTree';
import { getHostname } from '../../lib/helpers';
import { ExclusionStates } from '../../common/exclusionsConstants';
import { getETld } from './exclusions/ExclusionsHandler';

export class ExclusionsService {
    exclusionsTree: ExclusionsTree;

    constructor() {
        this.exclusionsTree = new ExclusionsTree(exclusionsManager, servicesManager);
    }

    async init() {
        await exclusionsManager.init();
        await servicesManager.init();
        this.updateTree();
    }

    getExclusions() {
        const exclusions = this.exclusionsTree.getExclusions();
        console.log(exclusions);

        return exclusions;
    }

    getMode() {
        return exclusionsManager.current.mode;
    }

    updateTree() {
        this.exclusionsTree.generateTree();
    }

    /**
     * Returns services with state
     */
    getServices() {
        let services = servicesManager.getServicesDto();

        services = services.map((service) => {
            const state = this.exclusionsTree.getExclusionState(service.serviceId);
            if (!state) {
                return {
                    ...service,
                    state: ExclusionStates.Disabled,
                };
            }
            return {
                ...service,
                state,
            };
        });

        return services;
    }

    async addUrlToExclusions(url: string) {
        // FIXME remove knowledge about current
        // check if domain is in the service, or group
        const hostname = getHostname(url);

        if (!hostname) {
            return;
        }

        // FIXME check if is in the service
        if (ipaddr.isValid(hostname)) {
            await exclusionsManager.current.addUrlToExclusions(hostname);
        } else {
            const eTld = getETld(hostname);

            if (!eTld) {
                return;
            }

            if (exclusionsManager.current.hasETld(eTld)) {
                await exclusionsManager.current.addExclusions([hostname]);
            } else {
                const wildcardHostname = `*.${hostname}`;
                await exclusionsManager.current.addExclusions([hostname, wildcardHostname]);
            }
        }

        this.updateTree();
    }

    async removeExclusion(id: string) {
        const exclusionsToRemove = this.exclusionsTree.getPathExclusions(id);
        await exclusionsManager.current.removeExclusions(exclusionsToRemove);

        this.updateTree();
    }

    async toggleExclusionState(id: string) {
        const targetExclusionState = this.exclusionsTree.getExclusionState(id);
        if (!targetExclusionState) {
            throw new Error(`There is no such id in the tree: ${id}`);
        }

        const exclusionsToToggle = this.exclusionsTree.getPathExclusions(id);

        // handle partlyEnabled state
        const state = targetExclusionState === ExclusionStates.Enabled
            ? ExclusionStates.Disabled
            : ExclusionStates.Enabled;

        await exclusionsManager.current.setExclusionsState(exclusionsToToggle, state);

        this.updateTree();
    }

    async clearExclusionsData() {
        await exclusionsManager.current.clearExclusionsData();

        this.updateTree();
    }

    async toggleServices(servicesIds: string[]) {
        const servicesIdsToRemove = servicesIds.filter((id) => {
            const exclusionNode = this.exclusionsTree.getExclusionNode(id);
            return !!exclusionNode;
        });

        const exclusionsToRemove = servicesIdsToRemove.map((id) => {
            return this.exclusionsTree.getPathExclusions(id);
        }).flat();

        await exclusionsManager.current.removeExclusions(exclusionsToRemove);

        const servicesIdsToAdd = servicesIds.filter((id) => {
            const exclusionNode = this.exclusionsTree.getExclusionNode(id);
            return !exclusionNode;
        });

        const servicesDomainsToAdd = servicesIdsToAdd.map((id) => {
            const service = servicesManager.getService(id);
            if (!service) {
                return [];
            }

            return service.domains;
        }).flat();

        const servicesDomainsWithWildcards = servicesDomainsToAdd.map((hostname) => {
            const wildcardHostname = `*.${hostname}`;
            return [hostname, wildcardHostname];
        }).flat();

        await exclusionsManager.current.addExclusions(servicesDomainsWithWildcards);

        this.updateTree();
    }
}
