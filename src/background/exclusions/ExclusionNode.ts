/* eslint-disable no-restricted-syntax */
import { ExclusionState, ExclusionsType } from '../../common/exclusionsConstants';

import { ExclusionDto } from './ExclusionDto';

type ExclusionNodeMap = Map<string, ExclusionNode>;

interface ExclusionNodeProps {
    id: string;

    hostname: string;

    state?: ExclusionState;

    type?: ExclusionsType;

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

    type: ExclusionsType;

    children: ExclusionNodeMap = new Map<string, ExclusionNode>();

    parentId: string | null;

    meta?: {
        domains: string[],
        iconUrl: string,
    };

    constructor({
        id,
        hostname,
        type = ExclusionsType.Exclusion,
        state = ExclusionState.Enabled,
        meta,
    }: ExclusionNodeProps) {
        this.id = id;
        this.parentId = null;
        this.hostname = hostname;
        this.state = state;
        this.type = type;
        if (meta) {
            this.meta = meta;
        }
    }

    /**
     * Adds child to exclusion node
     * @param child
     */
    addChild(child: ExclusionNode) {
        // eslint-disable-next-line no-param-reassign
        child.parentId = this.id;
        this.children.set(child.id, child);

        this.state = this.calculateState();
    }

    /**
     * Calculates state of exclusion node according to children
     */
    calculateState(): ExclusionState {
        const children = [...this.children.values()];

        const effectiveExclusions = selectEffective(children);

        const allEnabled = effectiveExclusions
            .every((exclusionNode) => exclusionNode.state === ExclusionState.Enabled);

        if (this.type === ExclusionsType.Service) {
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
        const children = [...this.children.values()].map((child) => child.serialize());

        return new ExclusionDto({
            id: this.id,
            parentId: this.parentId,
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
        const children = [...this.children.values()];
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

    /**
     * Returns the list of exclusion's children ids
     * @param id
     */
    getPathExclusions(id: string): string[] {
        if (this.id === id) {
            return this.getLeafsIds();
        }

        if (this.children.size === 0) {
            return [];
        }

        const childrenPathExclusions = [...this.children.values()]
            .map((child) => child.getPathExclusions(id));

        return childrenPathExclusions.flat();
    }

    /**
     * Returns exclusion node by provided id
     * @param id
     */
    getExclusionNode(id: string): ExclusionNode | null {
        if (this.id === id) {
            return this;
        }

        const foundChildren = this.children.get(id);
        if (foundChildren) {
            return foundChildren;
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const child of this.children.values()) {
            const node = child.getExclusionNode(id);
            if (node) {
                return node;
            }
        }

        return null;
    }

    /**
     * Returns parent exclusion node by provided id
     * @param id
     */
    getParentExclusionNode(id: string): ExclusionNode | null {
        const node = this.getExclusionNode(id);
        if (node?.parentId) {
            return this.getExclusionNode(node.parentId);
        }
        return null;
    }

    /**
     * Returns state of exclusion node
     * @param id
     */
    getExclusionNodeState(id: string): ExclusionState | null {
        const foundNode = this.getExclusionNode(id);
        if (foundNode) {
            return foundNode.state;
        }

        return null;
    }
}
