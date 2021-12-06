/* eslint-disable */
import { getHostname } from '../../lib/helpers';
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
            this.children = this.children.filter((child) => child.id === foundChild.id);
        } else {
            for (let i = 0; i < this.children.length; i += 1) {
                const child = this.children[i];
                child.removeChild(id);
            }
        }
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

// 'example.org' -> 'example.org',
// '*.example.org' -> 'example.org',

// const IndexedServices = {
//     service: {
//         1: {
//             id: 1,
//             groups: [1, 2],
//         },
//     },
//     'example.org': '1',
// };

const getTld = (hostname: string) => {
    // TODO implement more complex logic
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

            // if (this.exclusions[hostname]) {
            //     // example.org
            //     // *.example.org
            //     // mail.example.org
            //     // TODO
            //     continue;
            // }
        }
    }

    // addExclusionByUrl(url: string) {
    //     const hostname = getHostname(url);
    //     if (!hostname) {
    //         throw new Error(`Can not create exclusion from: ${url}`);
    //     }
    //     // FIXME check if is ip
    //     // FIXME check if is tld
    //     // FIXME check if is in the service
    //     const isTld = true;
    //     if (isTld) {
    //         // synthetic exclusion for group
    //         const exclusion = new ExclusionNode(hostname);
    //
    //         // real exclusions
    //         const hostnameExclusion = new ExclusionNode(hostname);
    //         const wildcardExclusion = new ExclusionNode(`*.${hostname}`);
    //         exclusion.addChild(hostnameExclusion);
    //         exclusion.addChild(wildcardExclusion);
    //         this.exclusionsTree.addChild(exclusion);
    //
    //         // TODO save real exclusions to the exclusions list
    //         this.exclusions.push(hostnameExclusion);
    //         this.exclusions.push(wildcardExclusion);
    //
    //         this.exclusionsTree.addChild(exclusion);
    //     }
    // }

    // removeExclusion(id: string) {
    //     this.exclusions.removeExclusion(id);
    //
    //     this.exclusions.removeChild(id);
    // }

    getExclusions() {
        return this.exclusionsTree.serialize();
    }
}
