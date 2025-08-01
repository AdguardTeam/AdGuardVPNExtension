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
import { type ExclusionInterface, type ExclusionsState, StorageKey } from '../schema';
import {
    getETld,
    getHostname,
    getSubdomain,
    isWildcard,
} from '../../common/utils/url';
import { notifier } from '../../common/notifier';
import { stateStorage } from '../stateStorage';

import { type AllExclusions, exclusionsManager } from './exclusions/ExclusionsManager';
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
     * Promise that resolves when the exclusions service is initialized.
     */
    private initPromise: Promise<void> | null = null;

    /**
     * Current exclusions service state.
     */
    private state: ExclusionsState;

    exclusionsTree = new ExclusionsTree();

    /**
     * Here we keep previous exclusions state in order to make possible undo action
     */
    private get previousExclusions() {
        return this.state.previousExclusions;
    }

    private set previousExclusions(previousExclusions: AllExclusions | null) {
        this.state.previousExclusions = previousExclusions;
        stateStorage.setItem(StorageKey.ExclusionsState, this.state);
    }

    /**
     * Initializes the exclusions service by waiting for dependant services to be initialized.
     */
    private async innerInit() {
        // Wait for state storage to be initialized
        await stateStorage.init();

        this.state = stateStorage.getItem(StorageKey.ExclusionsState);

        await exclusionsManager.init();
        await servicesManager.init();

        this.updateTree();

        notifier.addSpecifiedListener(
            notifier.types.NON_ROUTABLE_DOMAIN_ADDED,
            (payload: string) => {
                if (this.getMode() === ExclusionsMode.Regular) {
                    this.addUrlToExclusions(payload);
                }
            },
        );
    }

    /**
     * Initializes the exclusions service.
     *
     * Note: You can call this method to wait for the exclusions service to be initialized,
     * because it was implemented as it can be called multiple times but
     * initialization will happen only once.
     *
     * @returns Promise that resolves when the exclusions service is initialized.
     */
    public async init(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = this.innerInit();
        }

        return this.initPromise;
    }

    /**
     * Returns exclusions
     */
    getExclusions(): ExclusionDtoInterface {
        return this.exclusionsTree.getExclusions();
    }

    /**
     * Returns current exclusions mode
     */
    getMode(): ExclusionsMode {
        return exclusionsManager.current.mode;
    }

    /**
     * Sets exclusions mode
     * @param mode
     * @param shouldNotifyOptionsPage
     */
    async setMode(mode: ExclusionsMode, shouldNotifyOptionsPage?: boolean) {
        await exclusionsManager.setCurrentMode(mode);

        this.updateTree();

        // shouldNotifyOptionsPage flag is used to notify options page to update exclusions data,
        // if exclusion mode was changed from context menu
        if (shouldNotifyOptionsPage) {
            notifier.notifyListeners(notifier.types.EXCLUSIONS_DATA_UPDATED);
        }
    }

    /**
     * Updates exclusions tree
     */
    updateTree() {
        this.exclusionsTree.generateTree({
            exclusions: exclusionsManager.getExclusions(),
            indexedExclusions: exclusionsManager.getIndexedExclusions(),
            services: servicesManager.getServices(),
            indexedServices: servicesManager.getIndexedServices(),
        });
    }

    /**
     * Updates services.
     */
    async forceUpdateServices() {
        await servicesManager.updateServices();
    }

    /**
     * Returns services with state
     */
    getServices(): ServiceDto[] {
        let services = servicesManager.getServicesDto();

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
     * Creates data prepared for adding exclusion from provided url
     * @param url
     */
    supplementExclusion(url: string): AddExclusionArgs[] {
        const hostname = getHostname(url);
        if (!hostname) {
            return [];
        }

        const eTld = getETld(hostname);
        if (!eTld) {
            return [];
        }

        // if provided url is service, add all service's groups
        const serviceData = servicesManager.getServicesDto()
            .find((service) => service.domains.includes(hostname));

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
     * Creates data necessary for exclusions to add
     * @param exclusions
     */
    supplementExclusions(exclusions: string[]) {
        return exclusions.flatMap((ex) => {
            return this.supplementExclusion(ex);
        });
    }

    /**
     * Adds url to exclusions and returns amount of added exclusions
     * @param url
     */
    async addUrlToExclusions(url: string): Promise<number> {
        this.savePreviousExclusions();

        const hostname = getHostname(url);

        if (!hostname) {
            return 0;
        }

        // if provided url is existing exclusion, enables it
        const existingExclusion = exclusionsManager.current.getExclusionByHostname(hostname);
        if (existingExclusion) {
            await exclusionsManager.current.enableExclusion(existingExclusion.id);
            this.updateTree();
            return 0;
        }

        // add service manually by domain
        const serviceData = servicesManager.getServicesDto()
            .find((service) => service.domains.includes(hostname));
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

            await exclusionsManager.current
                .setExclusionsState(exclusionsToDisable, ExclusionState.Disabled);

            // enable only added exclusion
            const domainExclusion = exclusionsManager.current
                .getExclusionByHostname(hostname);
            const subdomainExclusion = exclusionsManager.current
                .getExclusionByHostname(`*.${hostname}`);
            if (domainExclusion && subdomainExclusion) {
                await exclusionsManager.current.setExclusionsState(
                    [domainExclusion.id, subdomainExclusion.id],
                    ExclusionState.Enabled,
                );
            }

            this.updateTree();
            return addedExclusionsCount;
        }

        // if provided url is IP-address, adds ip exclusion
        if (isIP(hostname)) {
            await exclusionsManager.current.addUrlToExclusions(hostname);
            this.updateTree();
            return 1;
        }

        const eTld = getETld(hostname);

        if (!eTld) {
            return 0;
        }

        if (exclusionsManager.current.hasETld(eTld)) {
            await exclusionsManager.current.addExclusions([{ value: hostname }]);
            this.updateTree();
            return 1;
        }

        // if provided url is subdomain, adds disabled domain exclusion and all-subdomains exclusion
        // and enabled subdomain exclusion
        const subdomain = getSubdomain(hostname, eTld);
        if (subdomain) {
            if (isWildcard(subdomain)) {
                const subdomainHostname = `${subdomain}.${eTld}`;
                await exclusionsManager.current.addExclusions([
                    { value: eTld, enabled: false },
                    { value: subdomainHostname, enabled: true },
                ]);
                this.updateTree();
                return 2;
            }

            const wildcardHostname = `*.${eTld}`;
            const subdomainHostname = `${subdomain}.${eTld}`;
            await exclusionsManager.current.addExclusions([
                { value: eTld, enabled: false },
                { value: wildcardHostname, enabled: false },
                { value: subdomainHostname, enabled: true },
            ]);
            this.updateTree();
            return 3;
        }

        const wildcardHostname = `*.${hostname}`;
        await exclusionsManager.current.addExclusions([
            { value: hostname },
            { value: wildcardHostname },
        ]);
        this.updateTree();
        return 2;
    }

    /**
     * Adds services to exclusions and returns amount of added exclusions
     * @param serviceIds
     */
    async addServices(serviceIds: string[]): Promise<number> {
        const servicesDomainsToAdd = serviceIds.map((id) => {
            const service = servicesManager.getService(id);
            if (!service) {
                return [];
            }

            return service.domains;
        }).flat();

        const servicesDomainsWithWildcards = servicesDomainsToAdd.map((hostname) => {
            const wildcardHostname = `*.${hostname}`;
            return [
                { value: hostname },
                { value: wildcardHostname },
            ];
        }).flat();

        await exclusionsManager.current.addExclusions(servicesDomainsWithWildcards);

        this.updateTree();
        return servicesDomainsWithWildcards.length;
    }

    /**
     * Checks provided exclusion is main domain exclusion
     * @param exclusionNode
     */
    isBasicExclusion(exclusionNode: ExclusionNode | null): boolean {
        return !exclusionNode?.hostname.match(/.+\..+\./);
    }

    /**
     * Removes exclusion by id and returns amount of removed exclusions
     * @param id
     */
    async removeExclusion(id: string): Promise<number> {
        this.savePreviousExclusions();

        let exclusionsToRemove = this.exclusionsTree.getPathExclusions(id);
        const exclusionNode = this.exclusionsTree.getExclusionNode(id);
        const parentNode = this.exclusionsTree.getParentExclusionNode(id);

        if (parentNode?.type === ExclusionsType.Group && this.isBasicExclusion(exclusionNode)) {
            exclusionsToRemove = this.exclusionsTree.getPathExclusions(parentNode.id);
        }

        await exclusionsManager.current.removeExclusions(exclusionsToRemove);

        this.updateTree();

        return exclusionsToRemove.length;
    }

    /**
     * Toggles exclusion state
     * @param id
     */
    async toggleExclusionState(id: string) {
        const targetExclusionState = this.exclusionsTree.getExclusionState(id);
        if (!targetExclusionState) {
            throw new Error(`There is no such id in the tree: ${id}`);
        }

        const exclusionsToToggle = this.exclusionsTree.getPathExclusions(id);

        const state = targetExclusionState === ExclusionState.Disabled
            ? ExclusionState.Enabled
            : ExclusionState.Disabled;

        await exclusionsManager.current.setExclusionsState(exclusionsToToggle, state);

        this.updateTree();
    }

    /**
     * Removes exclusions for current mode
     */
    async clearExclusionsData() {
        this.savePreviousExclusions();
        await exclusionsManager.current.clearExclusionsData();

        this.updateTree();
    }

    /**
     * Adds/removes services by provided ids:
     * @param servicesIds
     */
    async toggleServices(servicesIds: string[]): Promise<ToggleServicesResult> {
        this.savePreviousExclusions();

        const servicesIdsToRemove = servicesIds.filter((id) => {
            const exclusionNode = this.exclusionsTree.getExclusionNode(id);
            return !!exclusionNode;
        });

        const exclusionsToRemove = servicesIdsToRemove.map((id) => {
            return this.exclusionsTree.getPathExclusions(id);
        }).flat();

        await exclusionsManager.current.removeExclusions(exclusionsToRemove);

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
            await exclusionsManager.current.disableExclusionByUrl(url);
            this.updateTree();
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
            await exclusionsManager.current.disableExclusionByUrl(url);
            this.updateTree();
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
        /**
         * Wait for session storage after service worker awoken.
         * This is needed because this method might be called before
         * the extension is fully loaded between service worker restarts.
         */
        await this.init();

        if (!url || !exclusionsManager.currentHandler) {
            return true;
        }

        const isExcluded = exclusionsManager.currentHandler.isExcluded(punycode.toASCII(url));
        return exclusionsManager.inverted ? isExcluded : !isExcluded;
    }

    /**
     * Checks if exclusions are inverted or not.
     *
     * @returns True if exclusions are inverted, false otherwise.
     */
    public async isInverted(): Promise<boolean> {
        /**
         * Wait for session storage after service worker awoken.
         * This is needed because this method might be called before
         * the extension is fully loaded between service worker restarts.
         */
        await this.init();

        return exclusionsManager.inverted;
    }

    /**
     * Resets services data:
     * restores exclusions groups for service domains
     * enables main domain exclusions and all subdomains exclusions
     * doesn't affect for manually added subdomains
     * @param id
     */
    async resetServiceData(id: string) {
        const defaultServiceData = servicesManager.getService(id);
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

        await exclusionsManager.current.addExclusions(exclusionsToAdd);

        this.updateTree();
    }

    /**
     * Returns the string with the list of exclusions hostnames
     * @param exclusions
     */
    prepareExclusionsForExport(exclusions: ExclusionInterface[]): string {
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
     * Returns regular exclusions for export
     */
    getRegularExclusions() {
        const { exclusions } = exclusionsManager.regular;
        return this.prepareExclusionsForExport(exclusions);
    }

    /**
     * Returns selective exclusions for export
     */
    getSelectiveExclusions() {
        const { exclusions } = exclusionsManager.selective;
        return this.prepareExclusionsForExport(exclusions);
    }

    /**
     * Adds provided exclusions to the general list
     * and returns amount of added exclusions
     * @param exclusions
     */
    async addGeneralExclusions(exclusions: string[]) {
        this.savePreviousExclusions();

        const exclusionsWithState = exclusions.flatMap((ex) => {
            return this.supplementExclusion(ex);
        });

        const addedCount = await exclusionsManager.regular.addExclusions(exclusionsWithState);

        this.updateTree();

        return addedCount;
    }

    /**
     * Adds provided exclusions to the selective list
     * and returns amount of added exclusions
     * @param exclusions
     */
    async addSelectiveExclusions(exclusions: string[]) {
        this.savePreviousExclusions();

        const exclusionsWithState = this.supplementExclusions(exclusions);
        const addedCount = await exclusionsManager.selective.addExclusions(exclusionsWithState);

        this.updateTree();

        return addedCount;
    }

    async addExclusionsMap(exclusionsMap: {
        [ExclusionsMode.Selective]: string[],
        [ExclusionsMode.Regular]: string[],
    }) {
        this.savePreviousExclusions();

        const regularExclusionsWithState = this.supplementExclusions(
            exclusionsMap[ExclusionsMode.Regular],
        );
        const selectiveExclusionsWithState = this.supplementExclusions(
            exclusionsMap[ExclusionsMode.Selective],
        );
        const addedRegularCount = await exclusionsManager.regular.addExclusions(
            regularExclusionsWithState,
        );
        const addedSelectiveCount = await exclusionsManager.selective.addExclusions(
            selectiveExclusionsWithState,
        );

        this.updateTree();
        return addedRegularCount + addedSelectiveCount;
    }

    /**
     * Gets exclusions from exclusions manager and saves them to previousExclusions property
     */
    savePreviousExclusions = () => {
        this.previousExclusions = exclusionsManager.getAllExclusions();
    };

    /**
     * Restores previous exclusions
     */
    async restoreExclusions() {
        if (this.previousExclusions) {
            await exclusionsManager.setAllExclusions(this.previousExclusions);
            this.updateTree();
        }

        this.previousExclusions = null;
    }
}
