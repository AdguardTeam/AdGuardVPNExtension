import { nanoid } from 'nanoid';

import { getHostname } from '../../lib/helpers';
import { ExclusionStates } from '../../common/exclusionsConstants';

enum ExclusionTypes {
    Group = 'Group',
    Service = 'Service',
    Plain = 'Plain',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getType = (value: string) => {
    // FIXME implement
    return ExclusionTypes.Plain;
};

interface ExclusionArgs {
    value: string,
    state?: ExclusionStates,
    children?: Exclusion[],
}

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

class Exclusion {
    id: string;

    value: string;

    state: ExclusionStates;

    children: Exclusion[];

    constructor(value: string, state: ExclusionStates = ExclusionStates.Enabled) {
        this.id = nanoid();
        this.value = value;
        this.children = [];
        this.state = state;
    }

    hasChildren() {
        return this.children.length > 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calculateState(children: Exclusion[]): ExclusionStates {
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

export class ExclusionsTree {
    tree: Exclusion = new Exclusion({ value: 'root' });

    addExclusion(url: string) {
        const hostname = getHostname(url);
        if (!hostname) {
            throw new Error(`Can not create exclusion from: ${url}`);
        }

        // FIXME check if is ip
        // FIXME check if is tld
        const isTld = true;
        if (isTld) {
            const exclusion = new Exclusion({ value: hostname });
            exclusion.addChild(new Exclusion({ value: hostname }));
            exclusion.addChild(new Exclusion({ value: `*.${hostname}` }));
            this.tree.addChild(exclusion);
        }
    }

    removeExclusion(id: string) {
    }

    getExclusions() {
        return this.tree.serialize();
    }

    toggleExclusion() {

    }
}
