// FIXME remove eslint rules
/* eslint-disable max-classes-per-file,no-continue */
import { ExclusionDtoInterface, ExclusionStates } from '../../common/exclusionsConstants';
import { ExclusionsManager, IndexedExclusionsInterface } from './exclusions/ExclusionsManager';
import { IndexedServicesInterface, ServicesManager, servicesManager } from './services/ServicesManager';
import { getETld } from './exclusions/ExclusionsHandler';

class ExclusionDto implements ExclusionDtoInterface {
    id: string;

    value: string;

    state: ExclusionStates;

    iconUrl?: string;

    children: ExclusionDtoInterface[];

    constructor(
        id: string,
        value: string,
        state: ExclusionStates,
        children: ExclusionDtoInterface[],
    ) {
        this.id = id;
        this.value = value;
        this.state = state;
        this.children = children;

        const service = servicesManager.getService(id);
        if (service) {
            this.iconUrl = service.iconUrl;
        }
    }
}

export class ExclusionNode {
    id: string;

    value: string;

    state: ExclusionStates;

    children: ExclusionNode[];

    constructor(
        id: string,
        value: string,
        state: ExclusionStates = ExclusionStates.Enabled,
    ) {
        this.id = id;
        this.value = value;
        this.state = state;
        this.children = [];
    }

    hasChildren() {
        return this.children.length > 0;
    }

    addChild(child: ExclusionNode) {
        this.children.push(child);
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
        const children = this.children.map((child) => child.serialize());
        return new ExclusionDto(this.id, this.value, this.state, children);
    }

    /**
     * Returns leafs of current node, or node itself if it doesn't have children
     */
    getLeafs(): ExclusionNode[] {
        if (this.hasChildren()) {
            const childrenLeafs = this.children.map((child) => child.getLeafs());
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
        if (this.children.length === 0) {
            return [];
        }
        const childrenPathExclusions = this.children.map((child) => child.getPathExclusions(id));
        // @ts-ignore
        return childrenPathExclusions.flat(Infinity);
    }

    findNode(id: string): ExclusionNode | null {
        if (this.id === id) {
            return this;
        }

        for (let i = 0; i < this.children.length; i += 1) {
            const child = this.children[i];
            const node = child.findNode(id);
            if (node) {
                return node;
            }
        }

        return null;
    }

    getExclusionNodeState(id: string): ExclusionStates | null {
        const foundNode = this.findNode(id);
        if (foundNode) {
            return foundNode.state;
        }

        return null;
    }
}

export class ExclusionsTree {
    exclusionsTree = new ExclusionNode('root', 'root');

    exclusionsManager: ExclusionsManager;

    servicesManager: ServicesManager;

    groupIndex: { [index: string]: ExclusionNode } = {};

    constructor(
        exclusionsManager: ExclusionsManager,
        servicesManager: ServicesManager,
    ) {
        this.exclusionsManager = exclusionsManager;
        this.servicesManager = servicesManager;
    }

    generateTree() {
        this.groupIndex = {};
        this.exclusionsTree = new ExclusionNode('root', 'root');

        const indexedServices: IndexedServicesInterface = this.servicesManager.getIndexedServices();
        // eslint-disable-next-line max-len
        const indexedExclusions: IndexedExclusionsInterface = this.exclusionsManager.getIndexedExclusions();
        const exclusions = this.exclusionsManager.getExclusions();
        const services = this.servicesManager.getServices();

        for (let i = 0; i < exclusions.length; i += 1) {
            const exclusion = exclusions[i];

            // FIXME find better method for getTld;
            const hostnameTld = getETld(exclusion.hostname);

            if (!hostnameTld) {
                throw new Error(`All hostnames should have eTld: ${exclusion.hostname}`);
            }

            const groupNode = this.groupIndex[hostnameTld];

            if (groupNode) {
                const exclusionNode = new ExclusionNode(
                    exclusion.id,
                    exclusion.hostname,
                    exclusion.state,
                );
                groupNode.addChild(exclusionNode);
                continue;
            }

            const serviceId = indexedServices[hostnameTld];

            if (serviceId) {
                const service = services[serviceId];

                const serviceNode = new ExclusionNode(service.serviceName, service.serviceName);

                const groupNode = new ExclusionNode(hostnameTld, hostnameTld);
                this.groupIndex[hostnameTld] = groupNode;

                const exclusionNode = new ExclusionNode(
                    exclusion.id,
                    exclusion.hostname,
                    exclusion.state,
                );

                groupNode.addChild(exclusionNode);
                serviceNode.addChild(groupNode);

                this.exclusionsTree.addChild(serviceNode);

                continue;
            }

            const exclusionNode = new ExclusionNode(
                exclusion.id,
                exclusion.hostname,
                exclusion.state,
            );

            if (indexedExclusions[hostnameTld].length > 1) {
                const groupNode = new ExclusionNode(hostnameTld, hostnameTld);
                this.groupIndex[hostnameTld] = groupNode;
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
}
