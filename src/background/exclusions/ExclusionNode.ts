import { ExclusionStates, ExclusionsTypes } from '../../common/exclusionsConstants';
import { ExclusionDto } from './ExclusionDto';

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

    getExclusionNodeState(id: string): ExclusionStates | null {
        const foundNode = this.getExclusionNode(id);
        if (foundNode) {
            return foundNode.state;
        }

        return null;
    }
}
