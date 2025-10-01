import punycode from 'punycode';

import identity from 'lodash/identity';
import { isIP } from 'is-ip';

import {
    type ExclusionDtoInterface,
    ExclusionsMode,
    ExclusionState,
    ExclusionsType,
    type ServiceDto,
} from '../../common/exclusionsConstants';
import { type ExclusionInterface, StorageKey } from '../schema';
import {
    getETld,
    getHostname,
    getSubdomain,
    isWildcard,
} from '../../common/utils/url';
import { notifier } from '../../common/notifier';
import { StateData } from '../stateStorage';

import { exclusionsManager } from './exclusions/ExclusionsManager';
import { servicesManager } from './services/ServicesManager';
import { ExclusionsTree } from './ExclusionsTree';
import { type ExclusionNode } from './ExclusionNode';
import { type AddExclusionArgs } from './exclusions/ExclusionsHandler';

interface ToggleServicesResult {
    added: number,
    deleted: number,
}

export class ExclusionsService {
    /**
     * Exclusions service state data.
     * Used to save and retrieve exclusions state from session storage,
     * in order to persist it across service worker restarts.
     */
    private exclusionsState = new StateData(StorageKey.ExclusionsState);

    /**
     * {@link ExclusionsTree} instance.
     */
    private exclusionsTree = new ExclusionsTree();

    /**
     * Initializes the exclusions service by waiting for dependant services to be initialized.
     */
    public async init(): Promise<void> {
        await exclusionsManager.init();
        await servicesManager.init();

        await this.updateTree();

        notifier.addSpecifiedListener(
            notifier.types.NON_ROUTABLE_DOMAIN_ADDED,
            async (payload: string) => {
                if (await this.getMode() === ExclusionsMode.Regular) {
                    await this.addUrlToExclusions(payload);
                }
            },
        );
    }

    /**
     * Retrieves exclusions from the exclusions tree.
     *
     * @returns Serializable exclusions data.
     */
    public getExclusions(): ExclusionDtoInterface {
        return this.exclusionsTree.getExclusions();
    }

    /**
     * Retrieves current exclusions mode.
     *
     * @returns Current exclusions mode.
     */
    public async getMode(): Promise<ExclusionsMode> {
        const { currentModeHandler } = await exclusionsManager.getModeHandlers();
        return currentModeHandler.mode;
    }

    /**
     * Sets exclusions mode.
     *
     * @param mode New exclusions mode to set.
     * @param shouldNotifyOptionsPage Whether to notify the options page about the change.
     */
    public async setMode(mode: ExclusionsMode, shouldNotifyOptionsPage?: boolean): Promise<void> {
        await exclusionsManager.setCurrentMode(mode);

        await this.updateTree();

        // shouldNotifyOptionsPage flag is used to notify options page to update exclusions data,
        // if exclusion mode was changed from context menu
        if (shouldNotifyOptionsPage) {
            notifier.notifyListeners(notifier.types.EXCLUSIONS_DATA_UPDATED);
        }
    }

    /**
     * Updates exclusions tree.
     */
    private async updateTree(): Promise<void> {
        this.exclusionsTree.generateTree({
            exclusions: await exclusionsManager.getExclusions(),
            indexedExclusions: await exclusionsManager.getIndexedExclusions(),
            services: await servicesManager.getServices(),
            indexedServices: await servicesManager.getIndexedServices(),
        });
    }

    /**
     * Updates services.
     */
    public async forceUpdateServices(): Promise<void> {
        await servicesManager.updateServices();
    }

    /**
     * Retrieves services with their current states.
     *
     * @returns List of services with their states.
     */
    public async getServices(): Promise<ServiceDto[]> {
        let services = await servicesManager.getServicesDto();

        services = services.map((service) => {
            const state = this.exclusionsTree.getExclusionState(service.serviceId);
            if (!state) {
                return {
                    ...service,
                    state: ExclusionState.Disabled,
                };
            }
            return {
                ...service,
                state,
            };
        });

        return services;
    }

    /**
     * Creates data prepared for adding exclusion from provided url.
     *
     * @param url URL to create exclusion data from.
     *
     * @return List of exclusion arguments to be added.
     */
    private async supplementExclusion(url: string): Promise<AddExclusionArgs[]> {
        const hostname = getHostname(url);
        if (!hostname) {
            return [];
        }

        const eTld = getETld(hostname);
        if (!eTld) {
            return [];
        }

        // if provided url is service, add all service's groups
        const services = await servicesManager.getServicesDto();
        const serviceData = services.find((service) => service.domains.includes(hostname));

        if (serviceData) {
            const exclusionArgs: AddExclusionArgs[] = [];
            serviceData.domains.forEach((domain) => {
                const forceEnable = domain === hostname;
                exclusionArgs.push(
                    { value: domain, enabled: forceEnable, overwriteState: forceEnable },
                    { value: `*.${domain}`, enabled: false, overwriteState: false },
                );
            });

            return exclusionArgs;
        }

        const subdomain = getSubdomain(hostname, eTld);

        if (subdomain) {
            if (isWildcard(subdomain)) {
                const subdomainHostname = `${subdomain}.${eTld}`;
                return [
                    { value: eTld, enabled: false },
                    { value: subdomainHostname, enabled: true, overwriteState: true },
                ];
            }

            const wildcardHostname = `*.${eTld}`;
            const subdomainHostname = `${subdomain}.${eTld}`;
            return [
                { value: eTld, enabled: false },
                { value: wildcardHostname, enabled: false },
                { value: subdomainHostname, enabled: true, overwriteState: true },
            ];
        }

        const wildcardHostname = `*.${hostname}`;

        return [
            { value: hostname, enabled: true, overwriteState: true },
            { value: wildcardHostname, enabled: false },
        ];
    }

    /**
     * Creates data necessary for exclusions to add.
     *
     * @param exclusions List of exclusions to process.
     */
    private async supplementExclusions(exclusions: string[]): Promise<AddExclusionArgs[]> {
        const supplementedExclusions = await Promise.all(exclusions.map((ex) => this.supplementExclusion(ex)));
        return supplementedExclusions.flat();
    }

    /**
     * Adds url to exclusions and returns amount of added exclusions.
     *
     * @param url URL to add to exclusions.
     *
     * @return Amount of added exclusions.
     */
    public async addUrlToExclusions(url: string): Promise<number> {
        await this.savePreviousExclusions();

        const hostname = getHostname(url);

        if (!hostname) {
            return 0;
        }

        const { currentModeHandler } = await exclusionsManager.getModeHandlers();

        // if provided url is existing exclusion, enables it
        const existingExclusion = currentModeHandler.getExclusionByHostname(hostname);
        if (existingExclusion) {
            await currentModeHandler.enableExclusion(existingExclusion.id);
            await this.updateTree();
            return 0;
        }

        // add service manually by domain
        const services = await servicesManager.getServicesDto();
        const serviceData = services.find((service) => service.domains.includes(hostname));
        if (serviceData) {
            // get list of existing exclusions in service to keep their state
            const existingExclusionsIds = this.exclusionsTree
                .getPathExclusions(serviceData.serviceId);

            const addedExclusionsCount = await this.addServices([serviceData.serviceId]);

            // disable all exclusions in service except existing
            let exclusionsToDisable = this.exclusionsTree
                .getPathExclusions(serviceData.serviceId);

            if (existingExclusionsIds.length) {
                exclusionsToDisable = exclusionsToDisable.filter((exclusionId) => {
                    return !existingExclusionsIds.includes(exclusionId);
                });
            }

            await currentModeHandler.setExclusionsState(exclusionsToDisable, ExclusionState.Disabled);

            // enable only added exclusion
            const domainExclusion = currentModeHandler.getExclusionByHostname(hostname);
            const subdomainExclusion = currentModeHandler.getExclusionByHostname(`*.${hostname}`);
            if (domainExclusion && subdomainExclusion) {
                await currentModeHandler.setExclusionsState(
                    [domainExclusion.id, subdomainExclusion.id],
                    ExclusionState.Enabled,
                );
            }

            await this.updateTree();
            return addedExclusionsCount;
        }

        // if provided url is IP-address, adds ip exclusion
        if (isIP(hostname)) {
            await currentModeHandler.addUrlToExclusions(hostname);
            await this.updateTree();
            return 1;
        }

        const eTld = getETld(hostname);

        if (!eTld) {
            return 0;
        }

        if (currentModeHandler.hasETld(eTld)) {
            await currentModeHandler.addExclusions([{ value: hostname }]);
            await this.updateTree();
            return 1;
        }

        // if provided url is subdomain, adds disabled domain exclusion and all-subdomains exclusion
        // and enabled subdomain exclusion
        const subdomain = getSubdomain(hostname, eTld);
        if (subdomain) {
            if (isWildcard(subdomain)) {
                const subdomainHostname = `${subdomain}.${eTld}`;
                await currentModeHandler.addExclusions([
                    { value: eTld, enabled: false },
                    { value: subdomainHostname, enabled: true },
                ]);
                await this.updateTree();
                return 2;
            }

            const wildcardHostname = `*.${eTld}`;
            const subdomainHostname = `${subdomain}.${eTld}`;
            await currentModeHandler.addExclusions([
                { value: eTld, enabled: false },
                { value: wildcardHostname, enabled: false },
                { value: subdomainHostname, enabled: true },
            ]);
            await this.updateTree();
            return 3;
        }

        const wildcardHostname = `*.${hostname}`;
        await currentModeHandler.addExclusions([
            { value: hostname },
            { value: wildcardHostname },
        ]);
        await this.updateTree();
        return 2;
    }

    /**
     * Adds services to exclusions and returns amount of added exclusions.
     *
     * @param serviceIds List of service IDs to add.
     *
     * @returns Amount of added exclusions.
     */
    private async addServices(serviceIds: string[]): Promise<number> {
        const servicesDomainsToAdd = await Promise.all(serviceIds.map(async (id) => {
            const service = await servicesManager.getService(id);
            if (!service) {
                return [];
            }

            return service.domains;
        }));

        const servicesDomainsWithWildcards = servicesDomainsToAdd.flat().map((hostname) => {
            const wildcardHostname = `*.${hostname}`;
            return [
                { value: hostname },
                { value: wildcardHostname },
            ];
        }).flat();

        const { currentModeHandler } = await exclusionsManager.getModeHandlers();
        await currentModeHandler.addExclusions(servicesDomainsWithWildcards);

        await this.updateTree();
        return servicesDomainsWithWildcards.length;
    }

    /**
     * Checks provided exclusion is main domain exclusion.
     *
     * @param exclusionNode Exclusion node to check.
     *
     * @returns True if the exclusion is a basic exclusion, false otherwise.
     */
    private static isBasicExclusion(exclusionNode: ExclusionNode | null): boolean {
        return !exclusionNode?.hostname.match(/.+\..+\./);
    }

    /**
     * Removes exclusion by id and returns amount of removed exclusions.
     *
     * @param id Exclusion id to remove.
     *
     * @returns Amount of removed exclusions.
     */
    public async removeExclusion(id: string): Promise<number> {
        await this.savePreviousExclusions();

        let exclusionsToRemove = this.exclusionsTree.getPathExclusions(id);
        const exclusionNode = this.exclusionsTree.getExclusionNode(id);
        const parentNode = this.exclusionsTree.getParentExclusionNode(id);

        if (parentNode?.type === ExclusionsType.Group && ExclusionsService.isBasicExclusion(exclusionNode)) {
            exclusionsToRemove = this.exclusionsTree.getPathExclusions(parentNode.id);
        }

        const { currentModeHandler } = await exclusionsManager.getModeHandlers();
        await currentModeHandler.removeExclusions(exclusionsToRemove);

        await this.updateTree();

        return exclusionsToRemove.length;
    }

    /**
     * Toggles exclusion state.
     *
     * @param id Exclusion id to toggle.
     */
    public async toggleExclusionState(id: string): Promise<void> {
        const targetExclusionState = this.exclusionsTree.getExclusionState(id);
        if (!targetExclusionState) {
            throw new Error(`There is no such id in the tree: ${id}`);
        }

        const exclusionsToToggle = this.exclusionsTree.getPathExclusions(id);

        const state = targetExclusionState === ExclusionState.Disabled
            ? ExclusionState.Enabled
            : ExclusionState.Disabled;

        const { currentModeHandler } = await exclusionsManager.getModeHandlers();
        await currentModeHandler.setExclusionsState(exclusionsToToggle, state);

        await this.updateTree();
    }

    /**
     * Removes exclusions for current mode.
     */
    public async clearExclusionsData(): Promise<void> {
        await this.savePreviousExclusions();
        const { currentModeHandler } = await exclusionsManager.getModeHandlers();
        await currentModeHandler.clearExclusionsData();

        await this.updateTree();
    }

    /**
     * Adds/removes services by provided ids:
     *
     * @param servicesIds
     * @returns Added and removed exclusions count.
     */
    public async toggleServices(servicesIds: string[]): Promise<ToggleServicesResult> {
        await this.savePreviousExclusions();

        const servicesIdsToRemove = servicesIds.filter((id) => {
            const exclusionNode = this.exclusionsTree.getExclusionNode(id);
            return !!exclusionNode;
        });

        const exclusionsToRemove = servicesIdsToRemove.map((id) => {
            return this.exclusionsTree.getPathExclusions(id);
        }).flat();

        const { currentModeHandler } = await exclusionsManager.getModeHandlers();
        await currentModeHandler.removeExclusions(exclusionsToRemove);

        const servicesIdsToAdd = servicesIds.filter((id) => {
            const exclusionNode = this.exclusionsTree.getExclusionNode(id);
            return !exclusionNode;
        });

        const addedExclusionsCount = await this.addServices(servicesIdsToAdd);

        return {
            added: addedExclusionsCount,
            deleted: exclusionsToRemove.length,
        };
    }

    /**
     * Disables vpn for provided url.
     *
     * @param url URL to disable VPN for.
     */
    public async disableVpnByUrl(url: string): Promise<void> {
        if (await this.isInverted()) {
            const { currentModeHandler } = await exclusionsManager.getModeHandlers();
            await currentModeHandler.disableExclusionByUrl(url);
            await this.updateTree();
        } else {
            await this.addUrlToExclusions(url);
        }
        notifier.notifyListeners(notifier.types.EXCLUSIONS_DATA_UPDATED);
    }

    /**
     * Enables vpn for provided url.
     *
     * @param url URL to enable VPN for.
     */
    public async enableVpnByUrl(url: string): Promise<void> {
        if (await this.isInverted()) {
            await this.addUrlToExclusions(url);
        } else {
            const { currentModeHandler } = await exclusionsManager.getModeHandlers();
            await currentModeHandler.disableExclusionByUrl(url);
            await this.updateTree();
        }
        notifier.notifyListeners(notifier.types.EXCLUSIONS_DATA_UPDATED);
    }

    /**
     * Checks if vpn is enabled for url.
     * If this function is called when currentHandler is not set yet, it returns true.
     *
     * @param url URL to check for VPN status.
     *
     * @returns Promise that resolves to true if VPN is enabled for the URL, false otherwise.
     */
    public async isVpnEnabledByUrl(url: string): Promise<boolean> {
        const { currentModeHandler } = await exclusionsManager.getModeHandlers();
        if (!url || !currentModeHandler) {
            return true;
        }

        const isExcluded = currentModeHandler.isExcluded(punycode.toASCII(url));
        return await this.isInverted() ? isExcluded : !isExcluded;
    }

    /**
     * Checks if exclusions are inverted or not.
     *
     * @returns True if exclusions are inverted, false otherwise.
     */
    public async isInverted(): Promise<boolean> {
        return exclusionsManager.isInverted();
    }

    /**
     * Resets services data:
     * restores exclusions groups for service domains
     * enables main domain exclusions and all subdomains exclusions
     * doesn't affect for manually added subdomains.
     *
     * @param id Service id to reset data for.
     */
    public async resetServiceData(id: string): Promise<void> {
        const defaultServiceData = await servicesManager.getService(id);
        if (!defaultServiceData) {
            return;
        }

        const exclusionsToAdd = defaultServiceData.domains.flatMap((domain) => {
            return [
                {
                    value: domain,
                    enabled: true,
                    overwriteState: true,
                },
                {
                    value: `*.${domain}`,
                    enabled: true,
                    overwriteState: true,
                },
            ];
        });

        const { currentModeHandler } = await exclusionsManager.getModeHandlers();
        await currentModeHandler.addExclusions(exclusionsToAdd);

        await this.updateTree();
    }

    /**
     * Returns the string with the list of exclusions hostnames.
     *
     * @param exclusions Exclusions to prepare for export.
     *
     * @returns String with exclusions hostnames separated by new line.
     */
    private prepareExclusionsForExport(exclusions: ExclusionInterface[]): string {
        return exclusions.map((ex) => {
            if (ex.state === ExclusionState.Enabled) {
                return punycode.toUnicode(ex.hostname);
            }
            return null;
        })
            .filter(identity)
            .join('\n');
    }

    /**
     * Retrieves regular exclusions for export.
     *
     * @returns String with regular exclusions hostnames separated by new line.
     */
    public async getRegularExclusions(): Promise<string> {
        const { regularModeHandler: { exclusions } } = await exclusionsManager.getModeHandlers();
        return this.prepareExclusionsForExport(exclusions);
    }

    /**
     * Retrieves selective exclusions for export.
     *
     * @returns String with selective exclusions hostnames separated by new line.
     */
    public async getSelectiveExclusions(): Promise<string> {
        const { selectiveModeHandler: { exclusions } } = await exclusionsManager.getModeHandlers();
        return this.prepareExclusionsForExport(exclusions);
    }

    /**
     * Checks if both exclusions lists are empty.
     *
     * @returns True if both regular and selective exclusions lists are empty, false otherwise.
     */
    public async isAllExclusionListEmpty(): Promise<boolean> {
        const {
            regularModeHandler: { exclusions: regularExclusions },
            selectiveModeHandler: { exclusions: selectiveExclusions },
        } = await exclusionsManager.getModeHandlers();

        const enabledRegularExclusionsCount = regularExclusions
            .reduce((count, { state }) => (state === ExclusionState.Enabled ? count + 1 : count), 0);
        const enabledSelectiveExclusionsCount = selectiveExclusions
            .reduce((count, { state }) => (state === ExclusionState.Enabled ? count + 1 : count), 0);

        return !enabledRegularExclusionsCount && !enabledSelectiveExclusionsCount;
    }

    /**
     * Adds provided exclusions to the general list
     * and returns amount of added exclusions.
     *
     * @param exclusions List of exclusions to add.
     *
     * @returns Amount of added exclusions.
     */
    public async addGeneralExclusions(exclusions: string[]): Promise<number> {
        await this.savePreviousExclusions();

        const exclusionsWithState = await this.supplementExclusions(exclusions);
        const { regularModeHandler } = await exclusionsManager.getModeHandlers();
        const addedCount = await regularModeHandler.addExclusions(exclusionsWithState);

        await this.updateTree();

        return addedCount;
    }

    /**
     * Adds provided exclusions to the selective list
     * and returns amount of added exclusions.
     *
     * @param exclusions List of exclusions to add.
     *
     * @returns Amount of added exclusions.
     */
    public async addSelectiveExclusions(exclusions: string[]): Promise<number> {
        await this.savePreviousExclusions();

        const exclusionsWithState = await this.supplementExclusions(exclusions);
        const { selectiveModeHandler } = await exclusionsManager.getModeHandlers();
        const addedCount = await selectiveModeHandler.addExclusions(exclusionsWithState);

        await this.updateTree();

        return addedCount;
    }

    /**
     * Adds provided exclusions to the both lists (regular and selective).
     *
     * @param exclusionsMap Map of exclusions to add to both lists.
     *
     * @returns Total amount of added exclusions.
     */
    public async addExclusionsMap(exclusionsMap: {
        [ExclusionsMode.Selective]: string[],
        [ExclusionsMode.Regular]: string[],
    }): Promise<number> {
        await this.savePreviousExclusions();

        const { regularModeHandler, selectiveModeHandler } = await exclusionsManager.getModeHandlers();

        const regularExclusionsWithState = await this.supplementExclusions(exclusionsMap[ExclusionsMode.Regular]);
        const addedRegularCount = await regularModeHandler.addExclusions(regularExclusionsWithState);

        const selectiveExclusionsWithState = await this.supplementExclusions(exclusionsMap[ExclusionsMode.Selective]);
        const addedSelectiveCount = await selectiveModeHandler.addExclusions(selectiveExclusionsWithState);

        await this.updateTree();
        return addedRegularCount + addedSelectiveCount;
    }

    /**
     * Gets exclusions from exclusions manager and saves them to previousExclusions property.
     */
    private async savePreviousExclusions(): Promise<void> {
        const newPreviousExclusions = await exclusionsManager.getAllExclusions();
        await this.exclusionsState.update({ previousExclusions: newPreviousExclusions });
    }

    /**
     * Restores previous exclusions.
     */
    public async restoreExclusions(): Promise<void> {
        let { previousExclusions } = await this.exclusionsState.get();
        if (previousExclusions) {
            await exclusionsManager.setAllExclusions(previousExclusions);
            await this.updateTree();
        }

        previousExclusions = null;
        await this.exclusionsState.update({ previousExclusions });
    }
}
