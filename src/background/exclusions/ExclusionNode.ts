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
    if (!target.includes('*')) {
        return false;
    }

    const currentParts = current.split('.');
    const targetParts = target.split('.');

    while (currentParts.length > 0 && targetParts.length > 0) {
        const lastCurrent = currentParts.pop();
        const lastTarget = targetParts.pop();
        if (lastCurrent !== lastTarget) {
            return lastTarget === '*' && lastCurrent !== '*';
        }
    }

    return false;
};

/**
 * Selects nodes which effect on the state of the parent
 * e.g. for the list [*.example.org, test.example.org] will be returned only [*.example.org],
 * as test.example.org is covered by *.example.org
 * @param nodes
 */
export const selectEffective = <T extends { hostname: string }>(nodes: T[]): T[] => {
    let result = [...nodes];
    const wildcardNodes = nodes.filter((node) => node.hostname.includes('*'));
    result = result.filter((node) => {
        return !wildcardNodes.some((wildcardNode) => {
            return coveredBy(node.hostname, wildcardNode.hostname);
        });
    });

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

    addChild(child: ExclusionNode) {
        this.children[child.id] = child;

        this.state = this.calculateState();
    }

    calculateState(): ExclusionState {
        const children = Object.values(this.children);

        const effectiveExclusions = selectEffective(children);

        const allEnabled = effectiveExclusions
            .every((exclusionNode) => exclusionNode.state === ExclusionState.Enabled);

        if (this.type === ExclusionsTypes.Service) {
            const childrenAmount = children.length;

            if (allEnabled && this.meta?.domains.length !== childrenAmount) {
                return ExclusionState.PartlyEnabled;
            }
        }

        if (allEnabled) {
            return ExclusionState.Enabled;
        }

        const allDisabled = children
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
        const children = Object.values(this.children);
        if (children.length > 0) {
            return children.flatMap((child) => child.getLeafs());
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

        const foundChildren = this.children[id];
        if (foundChildren) {
            return foundChildren;
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

            const parentNode = child.findParentNode(Object.values(child.children), id);
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
