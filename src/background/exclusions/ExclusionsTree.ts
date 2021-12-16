// FIXME remove eslint rules
/* eslint-disable max-classes-per-file,no-continue */
import { ExclusionDtoInterface, ExclusionStates, ExclusionsTypes } from '../../common/exclusionsConstants';
import { ExclusionInterface, IndexedExclusionsInterface } from './exclusions/ExclusionsManager';
import {
    IndexedServicesInterface,
    ServicesInterface,
    servicesManager,
} from './services/ServicesManager';
import { getETld } from './exclusions/ExclusionsHandler';

class ExclusionDto implements ExclusionDtoInterface {
    id: string;

    value: string;

    state: ExclusionStates;

    type: ExclusionsTypes;

    iconUrl?: string;

    children: ExclusionDtoInterface[];

    constructor({
        id,
        value,
        state,
        type,
        children,
    }: {
        id: string,
        value: string,
        state: ExclusionStates,
        type: ExclusionsTypes,
        children: ExclusionDtoInterface[], }) {
        this.id = id;
        this.value = value;
        this.state = state;
        this.type = type;
        this.children = children;

        const service = servicesManager.getService(id);
        if (service) {
            this.iconUrl = service.iconUrl;
        }
    }
}

interface ExclusionNodeMap {
    [id: string]: ExclusionNode;
}

interface ExclusionNodeArgs {
    id: string;

    value: string;

    state?: ExclusionStates;

    type?: ExclusionsTypes;
}

export class ExclusionNode {
    id: string;

    value: string;

    state: ExclusionStates;

    type: ExclusionsTypes;

    children: ExclusionNodeMap = {};

    constructor({
        id,
        value,
        type = ExclusionsTypes.Exclusion,
        state = ExclusionStates.Enabled,
    }: ExclusionNodeArgs) {
        this.id = id;
        this.value = value;
        this.state = state;
        this.type = type;
    }

    hasChildren() {
        return Object.values(this.children).length > 0;
    }

    addChild(child: ExclusionNode) {
        this.children[child.id] = child;

        this.state = this.calculateState(this.getLeafs());
    }

    // FIXME compare with all available services
    calculateState(exclusionNodes: ExclusionNode[]): ExclusionStates {
        const allEnabled = exclusionNodes
            .every((exclusionNode) => exclusionNode.state === ExclusionStates.Enabled);

        if (allEnabled) {
            return ExclusionStates.Enabled;
        }

        const allDisabled = exclusionNodes
            .every((exclusionNode) => exclusionNode.state === ExclusionStates.Disabled);

        if (allDisabled) {
            return ExclusionStates.Disabled;
        }

        return ExclusionStates.PartlyEnabled;
    }

    serialize(): ExclusionDto {
        const children = Object.values(this.children).map((child) => child.serialize());
        return new ExclusionDto({
            id: this.id,
            value: this.value,
            state: this.state,
            type: this.type,
            children,
        });
    }

    /**
     * Returns leafs of current node, or node itself if it doesn't have children
     */
    getLeafs(): ExclusionNode[] {
        if (this.hasChildren()) {
            const childrenLeafs = Object.values(this.children).map((child) => child.getLeafs());
            // FIXME remove ts-ignore
            // @ts-ignore
            return childrenLeafs.flat(Infinity);
        }
        return [this];
    }

    /**
     * Returns leafs ids of current node
     */
    getLeafsIds(): string[] {
        return this.getLeafs().map((exclusionNode) => exclusionNode.id);
    }

    getPathExclusions(id: string): string[] {
        if (this.id === id) {
            return this.getLeafsIds();
        }
        if (Object.values(this.children).length === 0) {
            return [];
        }
        const childrenPathExclusions = Object.values(this.children)
            .map((child) => child.getPathExclusions(id));
        // FIXME remove @ts-ignore
        // @ts-ignore
        return childrenPathExclusions.flat(Infinity);
    }

    getExclusionNode(id: string): ExclusionNode | null {
        if (this.id === id) {
            return this;
        }

        const children = Object.values(this.children);

        for (let i = 0; i < children.length; i += 1) {
            const child = children[i];
            const node = child.getExclusionNode(id);
            if (node) {
                return node;
            }
        }

        return null;
    }

    getExclusionNodeState(id: string): ExclusionStates | null {
        const foundNode = this.getExclusionNode(id);
        if (foundNode) {
            return foundNode.state;
        }

        return null;
    }
}

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
}
