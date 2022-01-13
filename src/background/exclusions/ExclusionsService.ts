import { identity } from 'lodash';
import punycode from 'punycode';
import { isIP } from 'is-ip';

import { exclusionsManager } from './exclusions/ExclusionsManager';
import { servicesManager } from './services/ServicesManager';
import { ExclusionsTree } from './ExclusionsTree';
import { ExclusionNode } from './ExclusionNode';
import { ExclusionsModes, ExclusionState, ExclusionsTypes } from '../../common/exclusionsConstants';
import { AddExclusionArgs } from './exclusions/ExclusionsHandler';
import { ExclusionInterface } from './exclusions/exclusionsTypes';
import {
    getETld,
    getHostname,
    getSubdomain,
    isWildcard,
} from '../../common/url-utils';

interface ToggleServicesResult {
    added: number,
    deleted: number,
}

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
                    state: ExclusionState.Disabled,
                };
            }
            return {
                ...service,
                state,
            };
        });

        return services;
    }

    supplementExclusion(url: string): AddExclusionArgs[] {
        const hostname = getHostname(url);
        if (!hostname) {
            return [];
        }

        const eTld = getETld(hostname);
        if (!eTld) {
            return [];
        }

        const subdomain = getSubdomain(hostname, eTld);

        if (subdomain) {
            if (isWildcard(subdomain)) {
                const subdomainHostname = `${subdomain}.${eTld}`;
                return [
                    { value: eTld, enabled: false },
                    { value: subdomainHostname, enabled: true, overwriteState: true },
                ];
            }

            const wildcardHostname = `*.${eTld}`;
            const subdomainHostname = `${subdomain}.${eTld}`;
            return [
                { value: eTld, enabled: false },
                { value: wildcardHostname, enabled: false },
                { value: subdomainHostname, enabled: true, overwriteState: true },
            ];
        }

        const wildcardHostname = `*.${hostname}`;

        return [
            { value: hostname, enabled: true, overwriteState: true },
            { value: wildcardHostname, enabled: false },
        ];
    }

    /**
     * Adds url to exclusions and returns amount of added exclusions
     * @param url
     */
    async addUrlToExclusions(url: string): Promise<number> {
        const hostname = getHostname(url);

        if (!hostname) {
            return 0;
        }

        const existingExclusion = exclusionsManager.current.getExclusionByHostname(hostname);
        if (existingExclusion) {
            await exclusionsManager.current.enableExclusion(existingExclusion.id);
            this.updateTree();
            return 0;
        }

        // add service manually by domain
        const serviceData = servicesManager.getServicesDto()
            .find((service) => service.domains.includes(hostname));
        if (serviceData) {
            const addedExclusionsCount = await this.addServices([serviceData.serviceId]);

            // disable all exclusions in service
            const exclusionsToDisable = this.exclusionsTree
                .getPathExclusions(serviceData.serviceId);
            await exclusionsManager.current
                .setExclusionsState(exclusionsToDisable, ExclusionState.Disabled);

            // enable only added exclusion
            const domainExclusion = exclusionsManager.current
                .getExclusionByHostname(hostname);
            const subdomainExclusion = exclusionsManager.current
                .getExclusionByHostname(`*.${hostname}`);
            if (domainExclusion && subdomainExclusion) {
                await exclusionsManager.current.setExclusionsState(
                    [domainExclusion.id, subdomainExclusion.id],
                    ExclusionState.Enabled,
                );
            }

            this.updateTree();
            return addedExclusionsCount;
        }

        if (isIP(hostname)) {
            await exclusionsManager.current.addUrlToExclusions(hostname);
            this.updateTree();
            return 1;
        }

        const eTld = getETld(hostname);

        if (!eTld) {
            return 0;
        }

        if (exclusionsManager.current.hasETld(eTld)) {
            await exclusionsManager.current.addExclusions([{ value: hostname }]);
            this.updateTree();
            return 1;
        }

        const subdomain = getSubdomain(hostname, eTld);
        if (subdomain) {
            if (isWildcard(subdomain)) {
                const subdomainHostname = `${subdomain}.${eTld}`;
                await exclusionsManager.current.addExclusions([
                    { value: eTld, enabled: false },
                    { value: subdomainHostname, enabled: true },
                ]);
                this.updateTree();
                return 2;
            }

            const wildcardHostname = `*.${eTld}`;
            const subdomainHostname = `${subdomain}.${eTld}`;
            await exclusionsManager.current.addExclusions([
                { value: eTld, enabled: false },
                { value: wildcardHostname, enabled: false },
                { value: subdomainHostname, enabled: true },
            ]);
            this.updateTree();
            return 3;
        }

        const wildcardHostname = `*.${hostname}`;
        await exclusionsManager.current.addExclusions([
            { value: hostname },
            { value: wildcardHostname },
        ]);
        this.updateTree();
        return 2;
    }

    /**
     * Adds services to exclusions and returns amount of added exclusions
     * @param serviceIds
     */
    async addServices(serviceIds: string[]): Promise<number> {
        const servicesDomainsToAdd = serviceIds.map((id) => {
            const service = servicesManager.getService(id);
            if (!service) {
                return [];
            }

            return service.domains;
        }).flat();

        const servicesDomainsWithWildcards = servicesDomainsToAdd.map((hostname) => {
            const wildcardHostname = `*.${hostname}`;
            return [
                { value: hostname },
                { value: wildcardHostname },
            ];
        }).flat();

        await exclusionsManager.current.addExclusions(servicesDomainsWithWildcards);

        this.updateTree();
        return servicesDomainsWithWildcards.length;
    }

    isMainDomain(exclusionNode: ExclusionNode | null): boolean {
        return !exclusionNode?.hostname.match(/.+\..+\./);
    }

    /**
     * Removes exclusion by id and returns amount of removed exclusions
     * @param id
     */
    async removeExclusion(id: string): Promise<number> {
        let exclusionsToRemove = this.exclusionsTree.getPathExclusions(id);
        const exclusionNode = this.exclusionsTree.getExclusionNode(id);
        const parentNode = this.exclusionsTree.getParentExclusionNode(id);

        if (parentNode?.type === ExclusionsTypes.Group && this.isMainDomain(exclusionNode)) {
            exclusionsToRemove = this.exclusionsTree.getPathExclusions(parentNode.id);
        }

        await exclusionsManager.current.removeExclusions(exclusionsToRemove);

        this.updateTree();

        return exclusionsToRemove.length;
    }

    async getParentExclusion(id: string) {
        return this.exclusionsTree.getParentExclusionNode(id);
    }

    async toggleExclusionState(id: string) {
        const targetExclusionState = this.exclusionsTree.getExclusionState(id);
        if (!targetExclusionState) {
            throw new Error(`There is no such id in the tree: ${id}`);
        }

        const exclusionsToToggle = this.exclusionsTree.getPathExclusions(id);

        const state = targetExclusionState === ExclusionState.Disabled
            ? ExclusionState.Enabled
            : ExclusionState.Disabled;

        await exclusionsManager.current.setExclusionsState(exclusionsToToggle, state);

        this.updateTree();
    }

    async clearExclusionsData() {
        await exclusionsManager.current.clearExclusionsData();

        this.updateTree();
    }

    async toggleServices(servicesIds: string[]): Promise<ToggleServicesResult> {
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

        const addedExclusionsCount = await this.addServices(servicesIdsToAdd);

        return {
            added: addedExclusionsCount,
            deleted: exclusionsToRemove.length,
        };
    }

    async disableVpnByUrl(url: string) {
        if (this.isInverted()) {
            await exclusionsManager.current.disableExclusionByUrl(url);
            this.updateTree();
        } else {
            await this.addUrlToExclusions(url);
        }
    }

    async enableVpnByUrl(url: string) {
        if (this.isInverted()) {
            await this.addUrlToExclusions(url);
        } else {
            await exclusionsManager.current.disableExclusionByUrl(url);
            this.updateTree();
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

        const isExcluded = exclusionsManager.currentHandler.isExcluded(punycode.toASCII(url));
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

        const exclusionsToAdd = defaultServiceData.domains.flatMap((domain) => {
            return [
                {
                    value: domain,
                    enabled: true,
                    overwriteState: true,
                },
                {
                    value: `*.${domain}`,
                    enabled: true,
                    overwriteState: true,
                },
            ];
        });

        await exclusionsManager.current.addExclusions(exclusionsToAdd);

        this.updateTree();
    }

    prepareExclusionsForExport(exclusions: ExclusionInterface[]) {
        return exclusions.map((ex) => {
            if (ex.state === ExclusionState.Enabled) {
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

    async addGeneralExclusions(exclusions: string[]) {
        const exclusionsWithState = exclusions.flatMap((ex) => {
            return this.supplementExclusion(ex);
        });

        const addedCount = await exclusionsManager.regular.addExclusions(exclusionsWithState);

        this.updateTree();

        return addedCount;
    }

    async addSelectiveExclusions(exclusions: string[]) {
        const exclusionsWithState = exclusions.flatMap((ex) => {
            return this.supplementExclusion(ex);
        });

        const addedCount = await exclusionsManager.selective.addExclusions(exclusionsWithState);

        this.updateTree();

        return addedCount;
    }

    async setCurrentMode(mode: ExclusionsModes) {
        await exclusionsManager.setCurrentMode(mode);
    }
}
