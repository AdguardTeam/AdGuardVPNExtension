/* eslint-disable max-classes-per-file,no-continue */
import { ExclusionStates } from '../../common/exclusionsConstants';

class ExclusionDto {
    id: string;

    value: string;

    state: ExclusionStates;

    children: ExclusionDto[];

    constructor(
        id: string,
        value: string,
        state: ExclusionStates,
        children: ExclusionDto[],
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

    removeChild(id: string) {
        const foundChild = this.children.find((child) => child.id === id);
        if (foundChild) {
            this.children = this.children.filter((child) => child.id !== foundChild.id);
        } else {
            for (let i = 0; i < this.children.length; i += 1) {
                const child = this.children[i];
                child.removeChild(id);
            }
        }
        // FIXME: if this.children length === 0, remove parents to root
    }

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

interface ExclusionInterface {
    id: string,
    hostname: string,
    state: ExclusionStates,
}

interface GroupsInterface {
    id: string,
    value: string,
}

interface ServiceInterface {
    id: string,
    name: string,
    groups: GroupsInterface[],
}

interface ServicesInterface {
    [id: string]: ServiceInterface,
}
interface IndexedServicesInterface {
    [id: string]: string | ServicesInterface
    services: ServicesInterface,
}

const getTld = (hostname: string) => {
    return hostname.replace('*.', '');
};

export class ExclusionsHandler {
    exclusionsTree = new ExclusionNode('root', 'root');

    groupIndex: { [key: string]: ExclusionNode } = {};

    exclusions: ExclusionInterface[];

    services: IndexedServicesInterface;

    constructor(
        exclusions: ExclusionInterface[] = [],
        services: IndexedServicesInterface = { services: {} },
    ) {
        this.exclusions = exclusions;
        this.services = services;
    }

    generateTree() {
        for (let i = 0; i < this.exclusions.length; i += 1) {
            const exclusion = this.exclusions[i];
            const hostnameTld = getTld(exclusion.hostname);

            if (this.groupIndex[hostnameTld]) {
                const exclusionNode = new ExclusionNode(exclusion.id, exclusion.hostname);
                this.groupIndex[hostnameTld].addChild(exclusionNode);
                continue;
            }

            if (this.services[hostnameTld]) {
                const id = this.services[hostnameTld] as string;
                const service = this.services.services[id];
                const serviceNode = new ExclusionNode(service.id, service.name);

                const group = service.groups.find((group) => group.value === hostnameTld);

                if (!group) {
                    // TODO add exclusion outside of service
                    continue;
                }

                const groupNode = new ExclusionNode(group.id, group.value);
                this.groupIndex[hostnameTld] = groupNode;

                const exclusionNode = new ExclusionNode(exclusion.id, exclusion.hostname);

                groupNode.addChild(exclusionNode);
                serviceNode.addChild(groupNode);

                this.exclusionsTree.addChild(serviceNode);

                continue;
            }

            // if not in the service
            // remove _group from interpolation, temp solution
            const groupNode = new ExclusionNode(hostnameTld, hostnameTld);
            this.groupIndex[hostnameTld] = groupNode;
            const exclusionNode = new ExclusionNode(exclusion.id, exclusion.hostname);
            groupNode.addChild(exclusionNode);
            this.exclusionsTree.addChild(groupNode);
        }
    }

    removeExclusion(id: string) {
        this.exclusionsTree.removeChild(id);
    }

    getExclusions() {
        return this.exclusionsTree.serialize();
    }
}
