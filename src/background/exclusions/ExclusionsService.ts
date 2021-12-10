import ipaddr from 'ipaddr.js';
import { exclusionsManager } from './exclusions/ExclusionsManager';
import { servicesManager } from './services/ServicesManager';
import { ExclusionsTree } from './ExclusionsTree';
import { getHostname } from '../../lib/helpers';
import { ExclusionStates } from '../../common/exclusionsConstants';

export class ExclusionsService {
    exclusionsTree: ExclusionsTree;

    constructor() {
        this.exclusionsTree = new ExclusionsTree(exclusionsManager, servicesManager);
    }

    async init() {
        await exclusionsManager.init();
        await servicesManager.init();
        this.updateTree();
    }

    getExclusions() {
        const exclusions = this.exclusionsTree.getExclusions();

        console.log(exclusions);

        return exclusions;
    }

    getMode() {
        return exclusionsManager.current.mode;
    }

    updateTree() {
        this.exclusionsTree.generateTree();
    }

    /**
     * Returns services with state
     */
    getServices() {
        return servicesManager.getServicesDto();
    }

    async addUrlToExclusions(url: string) {
        console.log(url);
        // FIXME remove knowledge about current
        // check if domain is in the service, or group
        const hostname = getHostname(url);

        if (!hostname) {
            return;
        }

        // FIXME check if is in the service
        // FIXME check if is in the group
        if (ipaddr.isValid(hostname)) {
            await exclusionsManager.current.addUrlToExclusions(hostname);
        } else {
            const wildcardHostname = `*.${hostname}`;
            await exclusionsManager.current.addUrlToExclusions(url);
            await exclusionsManager.current.addUrlToExclusions(wildcardHostname);
        }

        this.updateTree();
    }

    async removeExclusion(id: string) {
        const exclusionsToRemove = this.exclusionsTree.getPathExclusions(id);
        await exclusionsManager.current.removeExclusions(exclusionsToRemove);

        this.updateTree();
    }

    async toggleExclusionState(id: string) {
        const targetExclusionState = this.exclusionsTree.getExclusionState(id);
        if (!targetExclusionState) {
            throw new Error(`There is no such id in the tree: ${id}`);
        }

        const exclusionsToToggle = this.exclusionsTree.getPathExclusions(id);

        console.log(exclusionsToToggle);

        // handle partlyEnabled state
        const state = targetExclusionState === ExclusionStates.Enabled
            ? ExclusionStates.Disabled
            : ExclusionStates.Enabled;

        await exclusionsManager.current.setExclusionsState(exclusionsToToggle, state);

        this.updateTree();
    }

    async clearExclusionsData() {
        await exclusionsManager.current.clearExclusionsData();

        this.updateTree();
    }
}
