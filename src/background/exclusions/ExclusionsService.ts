import ipaddr from 'ipaddr.js';
import { identity } from 'lodash';

import { exclusionsManager } from './exclusions/ExclusionsManager';
import { servicesManager } from './services/ServicesManager';
import { ExclusionsTree } from './ExclusionsTree';
import { getHostname } from '../../lib/helpers';
import { ExclusionsModes, ExclusionStates } from '../../common/exclusionsConstants';
import { getETld, getSubdomain } from './exclusions/ExclusionsHandler';
import { ExclusionInterface } from './exclusions/exclusionsTypes';

const isWildcard = (targetString: string) => {
    return targetString === '*';
};

export class ExclusionsService {
    exclusionsTree = new ExclusionsTree();

    async init() {
        await exclusionsManager.init();
        await servicesManager.init();

        this.updateTree();
    }

    getExclusions() {
        const exclusions = this.exclusionsTree.getExclusions();

        return exclusions;
    }

    getMode() {
        return exclusionsManager.current.mode;
    }

    async setMode(mode: ExclusionsModes) {
        await exclusionsManager.setCurrentMode(mode);

        this.updateTree();
    }

    updateTree() {
        this.exclusionsTree.generateTree({
            exclusions: exclusionsManager.getExclusions(),
            indexedExclusions: exclusionsManager.getIndexedExclusions(),
            services: servicesManager.getServices(),
            indexedServices: servicesManager.getIndexedServices(),
        });
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
        const hostname = getHostname(url);

        if (!hostname) {
            return;
        }

        const existingExclusion = exclusionsManager.current.getExclusionByHostname(hostname);
        if (existingExclusion) {
            await exclusionsManager.current.enableExclusion(existingExclusion.id);
            this.updateTree();
            return;
        }

        // add service manually by domain
        const serviceData = servicesManager.getServicesDto()
            .find((service) => service.domains.includes(hostname));
        if (serviceData) {
            await this.addServices([serviceData.serviceId]);

            // disable all exclusions in service
            const exclusionsToDisable = this.exclusionsTree
                .getPathExclusions(serviceData.serviceId);
            await exclusionsManager.current
                .setExclusionsState(exclusionsToDisable, ExclusionStates.Disabled);

            // enable only added exclusion
            const domainExclusion = exclusionsManager.current
                .getExclusionByHostname(hostname);
            const subdomainExclusion = exclusionsManager.current
                .getExclusionByHostname(`*.${hostname}`);
            if (domainExclusion && subdomainExclusion) {
                await exclusionsManager.current.setExclusionsState(
                    [domainExclusion.id, subdomainExclusion.id],
                    ExclusionStates.Enabled,
                );
            }

            this.updateTree();
            return;
        }

        if (ipaddr.isValid(hostname)) {
            await exclusionsManager.current.addUrlToExclusions(hostname);
        } else {
            const eTld = getETld(hostname);

            if (!eTld) {
                return;
            }

            if (exclusionsManager.current.hasETld(eTld)) {
                await exclusionsManager.current.addExclusions([{ value: hostname }]);
            } else {
                const subdomain = getSubdomain(hostname, eTld);
                if (subdomain) {
                    if (isWildcard(subdomain)) {
                        const subdomainHostname = `${subdomain}.${eTld}`;
                        await exclusionsManager.current.addExclusions([
                            { value: eTld, enabled: false },
                            { value: subdomainHostname, enabled: true },
                        ]);
                    } else {
                        const wildcardHostname = `*.${eTld}`;
                        const subdomainHostname = `${subdomain}.${eTld}`;
                        await exclusionsManager.current.addExclusions([
                            { value: eTld, enabled: false },
                            { value: wildcardHostname, enabled: false },
                            { value: subdomainHostname, enabled: true },
                        ]);
                    }
                } else {
                    const wildcardHostname = `*.${hostname}`;
                    await exclusionsManager.current.addExclusions([
                        { value: hostname },
                        { value: wildcardHostname },
                    ]);
                }
            }
        }

        this.updateTree();
    }

    async addServices(serviceIds: string[]) {
        const servicesDomainsToAdd = serviceIds.map((id) => {
            const service = servicesManager.getService(id);
            if (!service) {
                return [];
            }

            return service.domains;
        }).flat();

        const servicesDomainsWithWildcards = servicesDomainsToAdd.map((hostname) => {
            const wildcardHostname = `*.${hostname}`;
            return [{ value: hostname }, { value: wildcardHostname }];
        }).flat();

        await exclusionsManager.current.addExclusions(servicesDomainsWithWildcards);

        this.updateTree();
    }

    async removeExclusion(id: string) {
        const exclusionsToRemove = this.exclusionsTree.getPathExclusions(id);
        const exclusionNode = this.exclusionsTree.getExclusionNode(id);
        const parentNode = this.exclusionsTree.getParentExclusionNode(id);

        if (parentNode && parentNode.value === exclusionNode?.value) {
            await this.removeExclusion(parentNode.id);
        } else {
            await exclusionsManager.current.removeExclusions(exclusionsToRemove);
        }

        this.updateTree();
    }

    async toggleExclusionState(id: string) {
        const targetExclusionState = this.exclusionsTree.getExclusionState(id);
        if (!targetExclusionState) {
            throw new Error(`There is no such id in the tree: ${id}`);
        }

        const exclusionsToToggle = this.exclusionsTree.getPathExclusions(id);

        const state = targetExclusionState === ExclusionStates.Disabled
            ? ExclusionStates.Enabled
            : ExclusionStates.Disabled;

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

        await this.addServices(servicesIdsToAdd);
    }

    async disableVpnByUrl(url: string) {
        if (this.isInverted()) {
            // FIXME disable exclusion by url
        } else {
            await this.addUrlToExclusions(url);
        }
    }

    async enableVpnByUrl(url: string) {
        if (this.isInverted()) {
            await this.addUrlToExclusions(url);
        } else {
            // FIXME disable exclusion by url
        }
    }

    /**
     * Checks if vpn is enabled for url
     * If this function is called when currentHandler is not set yet, it returns true
     * @param url
     */
    isVpnEnabledByUrl(url: string) {
        if (!exclusionsManager.currentHandler) {
            return true;
        }

        const isExcluded = exclusionsManager.currentHandler.isExcluded(url);
        return exclusionsManager.inverted ? isExcluded : !isExcluded;
    }

    isInverted() {
        return exclusionsManager.inverted;
    }

    async resetServiceData(id: string) {
        const defaultServiceData = servicesManager.getService(id);

        if (!defaultServiceData) {
            return;
        }

        defaultServiceData?.domains.forEach((domain) => {
            this.addUrlToExclusions(domain);
            this.addUrlToExclusions(`*.${domain}`);
        });
        this.updateTree();
    }

    prepareExclusionsForExport(exclusions: ExclusionInterface[]) {
        return exclusions.map((ex) => {
            if (ex.state === ExclusionStates.Enabled) {
                return ex.hostname;
            }
            return null;
        })
            .filter(identity)
            .join('\n');
    }

    /**
     * Returns regular exclusions for export
     */
    getRegularExclusions() {
        const exclusions = exclusionsManager.regular.getExclusions();
        return this.prepareExclusionsForExport(exclusions);
    }

    /**
     * Returns selective exclusions for export
     */
    getSelectiveExclusions() {
        const exclusions = exclusionsManager.selective.getExclusions();
        return this.prepareExclusionsForExport(exclusions);
    }

    async addRegularExclusions(exclusions: string[]) {
        const exclusionsWithState = exclusions.map((ex) => ({ value: ex, enabled: true }));
        await exclusionsManager.regular.addExclusions(exclusionsWithState);
        // FIXME do not add same exclusions, and calculate how much exclusions were added
        return exclusions.length;
    }

    async addSelectiveExclusions(exclusions: string[]) {
        const exclusionsWithState = exclusions.map((ex) => ({ value: ex, enabled: true }));
        await exclusionsManager.regular.addExclusions(exclusionsWithState);
        // FIXME do not add same exclusions, and calculate how much exclusions were added
        return exclusions.length;
    }

    async setCurrentMode(mode: ExclusionsModes) {
        await exclusionsManager.setCurrentMode(mode);
    }
}
