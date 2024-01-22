/* eslint-disable no-continue */
import { isIP } from 'is-ip';

import { ExclusionDtoInterface, ExclusionsType } from '../../common/exclusionsConstants';
import { getETld } from '../../common/url-utils';
import type {
    ServicesIndexType,
    ServicesInterface,
    ExclusionInterface,
    IndexedExclusionsInterface,
} from '../schema';

import { ExclusionNode } from './ExclusionNode';

type ExclusionsNodesIndex = Map<string, ExclusionNode>;

export class ExclusionsTree {
    exclusionsTree = new ExclusionNode({ id: 'root', hostname: 'root' });

    /**
     * Map used to keep links to the nodes for faster search of existing nodes
     */
    exclusionsNodesIndex: ExclusionsNodesIndex = new Map();

    generateTree({
        exclusions,
        indexedExclusions,
        services,
        indexedServices,
    }: {
        exclusions: ExclusionInterface[];
        indexedExclusions: IndexedExclusionsInterface;
        services: ServicesInterface;
        indexedServices: ServicesIndexType;
    }) {
        this.exclusionsNodesIndex = new Map();
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

                const serviceNode = this.getExclusionNode(service.serviceId)
                    ?? new ExclusionNode({
                        id: service.serviceId,
                        hostname: service.serviceName,
                        type: ExclusionsType.Service,
                        meta: {
                            domains: service.domains,
                            iconUrl: service.iconUrl,
                        },
                    });

                const groupNode = this.getExclusionNode(hostnameTld)
                    ?? new ExclusionNode({
                        id: hostnameTld,
                        hostname: hostnameTld,
                        type: ExclusionsType.Group,
                    });

                this.addChild(groupNode, exclusionNode);
                this.addChild(serviceNode, groupNode);
                this.addChild(this.exclusionsTree, serviceNode);

                continue;
            }

            if (indexedExclusions[hostnameTld].length && !isIP(hostnameTld)) {
                const groupNode = this.getExclusionNode(hostnameTld)
                    ?? new ExclusionNode({
                        id: hostnameTld,
                        hostname: hostnameTld,
                        type: ExclusionsType.Group,
                    });

                this.addChild(groupNode, exclusionNode);
                this.addChild(this.exclusionsTree, groupNode);

                continue;
            }

            this.addChild(this.exclusionsTree, exclusionNode);
        }
    }

    /**
     * Adding child nodes through this method in order to increase speed of search of nodes
     * @param targetNode
     * @param childNode
     */
    addChild(targetNode: ExclusionNode, childNode: ExclusionNode) {
        this.exclusionsNodesIndex.set(childNode.id, childNode);
        targetNode.addChild(childNode);
    }

    /**
     * Returns exclusions
     */
    getExclusions(): ExclusionDtoInterface {
        const exclusionsRoot = this.exclusionsTree.serialize();
        return exclusionsRoot;
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

    /**
     * Returns exclusion node
     * @param id
     */
    getExclusionNode(id: string) {
        if (this.exclusionsNodesIndex.has(id)) {
            return this.exclusionsNodesIndex.get(id) ?? null;
        }

        return null;
    }

    /**
     * Returns parent exclusion node
     * @param id
     */
    getParentExclusionNode(id: string) {
        return this.exclusionsTree.getParentExclusionNode(id);
    }
}
