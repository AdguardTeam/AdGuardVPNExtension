/* eslint-disable no-continue */
import { ExclusionsTypes } from '../../common/exclusionsConstants';
import { ExclusionInterface, IndexedExclusionsInterface } from './exclusions/ExclusionsManager';
import { IndexedServicesInterface, ServicesInterface } from './services/ServicesManager';
import { getETld } from './exclusions/ExclusionsHandler';
import { ExclusionNode } from './ExclusionNode';

export class ExclusionsTree {
    exclusionsTree = new ExclusionNode({ id: 'root', value: 'root' });

    generateTree({
        exclusions,
        indexedExclusions,
        services,
        indexedServices,
    }: {
        exclusions: ExclusionInterface[];
        indexedExclusions: IndexedExclusionsInterface;
        services: ServicesInterface;
        indexedServices: IndexedServicesInterface;
    }) {
        this.exclusionsTree = new ExclusionNode({ id: 'root', value: 'root' });

        for (let i = 0; i < exclusions.length; i += 1) {
            const exclusion = exclusions[i];

            const hostnameTld = getETld(exclusion.hostname);

            if (!hostnameTld) {
                throw new Error(`All hostnames should have eTld: ${exclusion.hostname}`);
            }

            const exclusionNode = new ExclusionNode({
                id: exclusion.id,
                value: exclusion.hostname,
                state: exclusion.state,
            });

            const serviceId = indexedServices[hostnameTld];

            if (serviceId) {
                const service = services[serviceId];

                const serviceNode = this.exclusionsTree.getExclusionNode(service.serviceId)
                    ?? new ExclusionNode({
                        id: service.serviceId,
                        value: service.serviceName,
                        type: ExclusionsTypes.Service,
                        meta: {
                            domains: service.domains,
                            iconUrl: service.iconUrl,
                        },
                    });

                const groupNode = serviceNode.getExclusionNode(hostnameTld)
                    ?? new ExclusionNode({
                        id: hostnameTld,
                        value: hostnameTld,
                        type: ExclusionsTypes.Group,
                    });

                groupNode.addChild(exclusionNode);
                serviceNode.addChild(groupNode);

                this.exclusionsTree.addChild(serviceNode);

                continue;
            }

            if (indexedExclusions[hostnameTld].length > 1) {
                const groupNode = this.exclusionsTree.getExclusionNode(hostnameTld)
                    ?? new ExclusionNode({
                        id: hostnameTld,
                        value: hostnameTld,
                        type: ExclusionsTypes.Group,
                    });

                groupNode.addChild(exclusionNode);
                this.exclusionsTree.addChild(groupNode);

                continue;
            }

            this.exclusionsTree.addChild(exclusionNode);
        }
    }

    getExclusions() {
        const exclusionsRoot = this.exclusionsTree.serialize();
        return exclusionsRoot.children;
    }

    /**
     * Returns exclusion node id or all its children
     */
    getPathExclusions(id: string) {
        return this.exclusionsTree.getPathExclusions(id);
    }

    /**
     * Returns state of exclusion node by id
     * @param id
     */
    getExclusionState(id: string) {
        return this.exclusionsTree.getExclusionNodeState(id);
    }

    getExclusionNode(id: string) {
        return this.exclusionsTree.getExclusionNode(id);
    }

    getParentExclusionNode(id: string) {
        return this.exclusionsTree.getParentExclusionNode(id);
    }
}
