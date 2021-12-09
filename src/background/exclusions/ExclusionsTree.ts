// FIXME remove eslint rules
/* eslint-disable max-classes-per-file,no-continue */
import { ExclusionDtoInterface, ExclusionStates } from '../../common/exclusionsConstants';
import { ExclusionsManager, IndexedExclusionsInterface } from './exclusions/ExclusionsManager';
import { ServicesManager, IndexedServicesInterface } from './services/ServicesManager';

class ExclusionDto implements ExclusionDtoInterface {
    id: string;

    value: string;

    state: ExclusionStates;

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
    }
}

class ExclusionNode {
    id: string;

    value: string;

    state: ExclusionStates;

    // TODO add icon url
    // iconUrl?: string;

    children: ExclusionNode[];

    constructor(id: string, value: string, state: ExclusionStates = ExclusionStates.Enabled) {
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
    }

    // FIXME calculate state
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calculateState(children: ExclusionNode[]): ExclusionStates {
        return ExclusionStates.Enabled;
    }

    getState(): ExclusionStates {
        if (this.hasChildren()) {
            return this.calculateState(this.children);
        }
        return this.state;
    }

    serialize(): ExclusionDto {
        const children = this.children.map((child) => child.serialize());
        return new ExclusionDto(this.id, this.value, this.getState(), children);
    }
}

const getTld = (hostname: string) => {
    return hostname.replace('*.', '');
};

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
        const indexedServices: IndexedServicesInterface = this.servicesManager.getIndexedServices();
        // eslint-disable-next-line max-len
        const indexedExclusions: IndexedExclusionsInterface = this.exclusionsManager.getIndexedExclusions();
        const exclusions = this.exclusionsManager.getExclusions();
        const services = this.servicesManager.getServices();
        this.groupIndex = {};

        for (let i = 0; i < exclusions.length; i += 1) {
            const exclusion = exclusions[i];

            // FIXME find better method for getTld;
            const hostnameTld = getTld(exclusion.hostname);

            const groupNode = this.groupIndex[hostnameTld];

            if (groupNode) {
                const exclusionNode = new ExclusionNode(exclusion.id, exclusion.hostname);
                groupNode.addChild(exclusionNode);
                continue;
            }

            const serviceId = indexedServices[hostnameTld];

            if (serviceId) {
                const service = services[serviceId];

                const serviceNode = new ExclusionNode(service.serviceName, service.serviceName);

                const groupNode = new ExclusionNode(hostnameTld, hostnameTld);
                this.groupIndex[hostnameTld] = groupNode;

                const exclusionNode = new ExclusionNode(exclusion.id, exclusion.hostname);

                groupNode.addChild(exclusionNode);
                serviceNode.addChild(groupNode);

                this.exclusionsTree.addChild(serviceNode);

                continue;
            }

            const exclusionNode = new ExclusionNode(exclusion.id, exclusion.hostname);

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
}
