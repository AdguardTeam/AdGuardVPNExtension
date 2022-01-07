import { ExclusionState, ExclusionsTypes } from '../../common/exclusionsConstants';
import { ExclusionDto } from './ExclusionDto';

interface ExclusionNodeMap {
    [id: string]: ExclusionNode;
}

interface ExclusionNodeProps {
    id: string;

    hostname: string;

    state?: ExclusionState;

    type?: ExclusionsTypes;

    meta?: {
        domains: string[],
        iconUrl: string,
    }
}

export const coveredBy = (current: string, target: string) => {
    const currentParts = current.split('.');
    const targetParts = target.split('.');

    while (currentParts.length > 0 && targetParts.length > 0) {
        const lastCurrent = currentParts.pop();
        const lastTarget = targetParts.pop();
        if (lastCurrent !== lastTarget) {
            if (lastTarget === '*' && lastCurrent !== '*') {
                return true;
            }
            return false;
        }
    }

    return false;
};

export const selectConsiderable = <T extends { hostname: string }>(nodes: T[]): T[] => {
    let result = [...nodes];
    for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        result = result.filter((rNode) => {
            return !coveredBy(rNode.hostname, node.hostname);
        });
    }

    return result;
};

export class ExclusionNode {
    id: string;

    hostname: string;

    state: ExclusionState;

    type: ExclusionsTypes;

    children: ExclusionNodeMap = {};

    meta?: {
        domains: string[],
        iconUrl: string,
    };

    constructor({
        id,
        hostname,
        type = ExclusionsTypes.Exclusion,
        state = ExclusionState.Enabled,
        meta,
    }: ExclusionNodeProps) {
        this.id = id;
        this.hostname = hostname;
        this.state = state;
        this.type = type;
        if (meta) {
            this.meta = meta;
        }
    }

    hasChildren() {
        return Object.values(this.children).length > 0;
    }

    addChild(child: ExclusionNode) {
        this.children[child.id] = child;

        this.state = this.calculateState(this.getLeafs(), this);
    }

    calculateState(exclusionNodes: ExclusionNode[], node: ExclusionNode): ExclusionState {
        const considerableExclusions = selectConsiderable(exclusionNodes);

        const allEnabled = considerableExclusions
            .every((exclusionNode) => exclusionNode.state === ExclusionState.Enabled);

        if (node.type === ExclusionsTypes.Service) {
            const childrenAmount = Object.values(node.children).length;

            if (allEnabled && node.meta?.domains.length !== childrenAmount) {
                return ExclusionState.PartlyEnabled;
            }
        }

        if (allEnabled) {
            return ExclusionState.Enabled;
        }

        const allDisabled = exclusionNodes
            .every((exclusionNode) => exclusionNode.state === ExclusionState.Disabled);

        if (allDisabled) {
            return ExclusionState.Disabled;
        }

        return ExclusionState.PartlyEnabled;
    }

    serialize(): ExclusionDto {
        const children = Object.values(this.children).map((child) => child.serialize());
        return new ExclusionDto({
            id: this.id,
            hostname: this.hostname,
            state: this.state,
            type: this.type,
            children,
            iconUrl: this.meta?.iconUrl,
        });
    }

    /**
     * Returns leafs of current node, or node itself if it doesn't have children
     */
    getLeafs(): ExclusionNode[] {
        if (this.hasChildren()) {
            const childrenLeafs = Object.values(this.children).map((child) => child.getLeafs());
            return childrenLeafs.flat();
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

        return childrenPathExclusions.flat();
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

    getParentExclusionNode(id: string): ExclusionNode | null {
        if (this.id === id) {
            return null;
        }
        const children = Object.values(this.children);
        return this.findParentNode(children, id);
    }

    findParentNode(children: ExclusionNode[], id: string): ExclusionNode | null {
        for (let i = 0; i < children.length; i += 1) {
            const child = children[i];

            if (child.id === id) {
                return this;
            }

            if (Object.values(child.children).some((exclusion) => exclusion?.id === id)) {
                return child;
            }

            const parentNode = this.findParentNode(Object.values(child.children), id);
            if (parentNode) {
                return parentNode;
            }
        }
        return null;
    }

    getExclusionNodeState(id: string): ExclusionState | null {
        const foundNode = this.getExclusionNode(id);
        if (foundNode) {
            return foundNode.state;
        }

        return null;
    }
}
