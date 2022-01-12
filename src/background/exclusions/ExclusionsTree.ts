/* eslint-disable no-continue */
import ipaddr from 'ipaddr.js';

import { ExclusionsTypes } from '../../common/exclusionsConstants';
import { IndexedServicesInterface, ServicesInterface } from './services/ServicesManager';
import { ExclusionNode } from './ExclusionNode';
import { ExclusionInterface, IndexedExclusionsInterface } from './exclusions/exclusionsTypes';
import { getETld } from '../../common/url-utils';

export class ExclusionsTree {
    exclusionsTree = new ExclusionNode({ id: 'root', hostname: 'root' });

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
        this.exclusionsTree = new ExclusionNode({ id: 'root', hostname: 'root' });

        for (let i = 0; i < exclusions.length; i += 1) {
            const exclusion = exclusions[i];

            const hostnameTld = getETld(exclusion.hostname);

            if (!hostnameTld) {
                throw new Error(`All hostnames should have eTld: ${exclusion.hostname}`);
            }

            const exclusionNode = new ExclusionNode({
                id: exclusion.id,
                hostname: exclusion.hostname,
                state: exclusion.state,
            });

            const serviceId = indexedServices[hostnameTld];

            if (serviceId) {
                const service = services[serviceId];

                const serviceNode = this.exclusionsTree.getExclusionNode(service.serviceId)
                    ?? new ExclusionNode({
                        id: service.serviceId,
                        hostname: service.serviceName,
                        type: ExclusionsTypes.Service,
                        meta: {
                            domains: service.domains,
                            iconUrl: service.iconUrl,
                        },
                    });

                const groupNode = serviceNode.getExclusionNode(hostnameTld)
                    ?? new ExclusionNode({
                        id: hostnameTld,
                        hostname: hostnameTld,
                        type: ExclusionsTypes.Group,
                    });

                groupNode.addChild(exclusionNode);
                serviceNode.addChild(groupNode);

                this.exclusionsTree.addChild(serviceNode);

                continue;
            }

            if (indexedExclusions[hostnameTld].length && !ipaddr.isValid(hostnameTld)) {
                const groupNode = this.exclusionsTree.getExclusionNode(hostnameTld)
                    ?? new ExclusionNode({
                        id: hostnameTld,
                        hostname: hostnameTld,
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
