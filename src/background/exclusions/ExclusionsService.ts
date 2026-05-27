import punycode from 'punycode';

import identity from 'lodash/identity';
import { isIP } from 'is-ip';

import {
    type ExclusionDtoInterface,
    type ExclusionsMap,
    ExclusionsMode,
    ExclusionState,
    ExclusionsType,
    type GetExclusionsDataResponse,
    type ServiceDto,
    type ToggleServicesResult,
} from '../../common/exclusionsConstants';
import { type ExclusionInterface, type PersistedExclusions, StorageKey } from '../schema';
import {
    getETld,
    getHostname,
    getSubdomain,
    isWildcard,
} from '../../common/utils/url';
import { notifier } from '../../common/notifier';
import { profilesService } from '../profiles';
import { proxy } from '../proxy';
import { StateData } from '../stateStorage';

import { ExclusionsHandler, type AddExclusionArgs } from './exclusions/ExclusionsHandler';
import { servicesManager } from './services/ServicesManager';
import { ExclusionsTree } from './ExclusionsTree';
import { type ExclusionNode } from './ExclusionNode';

/**
 * Handlers for the two exclusion modes of a profile.
 */
interface ExclusionsHandlers {
    /**
     * Regular mode exclusions handler.
     */
    regularModeHandler: ExclusionsHandler;

    /**
     * Selective mode exclusions handler.
     */
    selectiveModeHandler: ExclusionsHandler;
}

/**
 * Combined per-profile exclusions data: handlers, inverted flag, and tree.
 */
interface ProfileExclusionsEntry {
    /**
     * Handlers for regular and selective exclusion modes.
     */
    handlers: ExclusionsHandlers;

    /**
     * Whether the profile uses selective (inverted) mode.
     */
    inverted: boolean;

    /**
     * Exclusions tree built from the current mode's handler.
     */
    tree: ExclusionsTree;
}

/**
 * Context for performing exclusion operations on a specific profile.
 */
interface ProfileExclusionsContext {
    /**
     * Resolved profile ID.
     */
    profileId: string;

    /**
     * Underlying profile exclusions entry.
     */
    entry: ProfileExclusionsEntry;

    /**
     * Handlers for both exclusion modes.
     */
    handlers: ExclusionsHandlers;

    /**
     * Convenience accessor for the handler matching the entry's current mode.
     */
    currentModeHandler: ExclusionsHandler;

    /**
     * Exclusions tree for this profile.
     */
    tree: ExclusionsTree;

    /**
     * Rebuilds the exclusions tree from current handler state.
     */
    updateTree: () => Promise<void>;
}

/**
 * Snapshot of a profile's exclusions at a point in time.
 */
interface ExclusionsSnapshot {
    /**
     * Regular mode exclusions at the time of the snapshot.
     */
    regular: ExclusionInterface[];

    /**
     * Selective mode exclusions at the time of the snapshot.
     */
    selective: ExclusionInterface[];
}

/**
 * Returns the handler matching the entry's current mode.
 *
 * @param entry Profile exclusions entry.
 * @returns Handler corresponding to the active mode.
 */
const getCurrentModeHandler = (entry: ProfileExclusionsEntry): ExclusionsHandler => {
    return entry.inverted
        ? entry.handlers.selectiveModeHandler
        : entry.handlers.regularModeHandler;
};

/**
 * Counts exclusions that are in {@link ExclusionState.Enabled} state.
 *
 * @param exclusions Exclusions to count.
 * @returns Number of enabled exclusions.
 */
const countEnabledExclusions = (exclusions: ExclusionInterface[]): number => {
    return exclusions.filter(({ state }) => state === ExclusionState.Enabled).length;
};

/**
 * Checks whether neither regular nor selective mode has any enabled exclusions.
 *
 * @param handlers Exclusions handlers for both modes.
 * @returns True if both lists have zero enabled exclusions.
 */
const isAllExclusionsListsEmpty = (handlers: ExclusionsHandlers): boolean => {
    return countEnabledExclusions(handlers.regularModeHandler.exclusions) === 0
        && countEnabledExclusions(handlers.selectiveModeHandler.exclusions) === 0;
};

export class ExclusionsService {
    /**
     * Persistent state storage for undo snapshots.
     */
    private exclusionsState = new StateData(StorageKey.ExclusionsState);

    /**
     * Per-profile exclusions data (handlers, inverted flag, tree).
     * Stores resolved promises for cached entries and in-flight promises
     * for profiles currently being loaded.
     */
    private profileDataMap = new Map<string, Promise<ProfileExclusionsEntry>>();

    /**
     * Removes cached exclusions data for a deleted profile.
     *
     * @param profileId Profile ID to remove from the cache.
     */
    public removeProfileData(profileId: string): void {
        this.profileDataMap.delete(profileId);
    }

    /**
     * Initializes the exclusions service by loading handlers for the active profile.
     */
    public async init(): Promise<void> {
        await servicesManager.init();

        const activeProfileId = profilesService.getActiveProfileId();
        await this.getOrCreateProfileData(activeProfileId);
        await this.updateProxyForActiveProfile();

        notifier.addSpecifiedListener(
            notifier.types.NON_ROUTABLE_DOMAIN_ADDED,
            async (payload: string) => {
                const profileId = profilesService.getActiveProfileId();
                if (await this.getMode(profileId) === ExclusionsMode.Regular) {
                    await this.addUrlToExclusions(profileId, payload);
                }
            },
        );
    }

    /**
     * Loads exclusions for the given profile and updates the proxy
     * bypass list. Called during profile switching.
     *
     * @param profileId Profile to apply.
     */
    public async applyActiveProfile(profileId: string): Promise<void> {
        await this.getOrCreateProfileData(profileId);
        await this.updateProxyForActiveProfile();
    }

    /**
     * Retrieves exclusions from the active profile's exclusions tree.
     *
     * @internal Used only in tests for assertions.
     * @returns Serializable exclusions data.
     */
    public async getExclusions(): Promise<ExclusionDtoInterface> {
        const profileId = profilesService.getActiveProfileId();
        const ctx = await this.getProfileContext(profileId);
        return ctx.tree.getExclusions();
    }

    /**
     * Retrieves exclusions data for all profiles as a map keyed by profile ID.
     *
     * @returns Map of profile ID to exclusions data.
     */
    public async getProfileExclusionsDataMap(): Promise<Record<string, GetExclusionsDataResponse>> {
        const { profiles } = await profilesService.getProfileInfoList();

        const servicesDto = await servicesManager.getServicesDto();
        const entries = await Promise.all(
            profiles.map(async (profile) => {
                await this.getOrCreateProfileData(profile.id);
                const data = await this.getExclusionsDataForProfile(profile.id, servicesDto);
                return [profile.id, data];
            }),
        );
        return Object.fromEntries(entries);
    }

    /**
     * Retrieves full exclusions data for a profile.
     *
     * @param profileId Profile ID to get exclusions data for.
     * @param servicesDto Optional pre-fetched services list to avoid redundant fetches in bulk calls.
     */
    public async getExclusionsDataForProfile(
        profileId: string,
        servicesDto?: ServiceDto[],
    ): Promise<GetExclusionsDataResponse> {
        const ctx = await this.getProfileContext(profileId);

        const baseServices = servicesDto ?? await servicesManager.getServicesDto();
        const services = baseServices.map((service) => {
            const serviceState = ctx.tree.getExclusionState(service.serviceId);
            return {
                ...service,
                state: serviceState ?? ExclusionState.Disabled,
            };
        });

        return {
            exclusionsData: {
                exclusions: ctx.tree.getExclusions(),
                currentMode: ctx.currentModeHandler.mode,
            },
            services,
            isAllExclusionsListsEmpty: isAllExclusionsListsEmpty(ctx.handlers),
        };
    }

    /**
     * Creates or retrieves the exclusions entry for a profile.
     * Entries are cached in profileDataMap and reused across calls.
     * Concurrent calls for the same profile share the same in-flight promise.
     *
     * @param profileId Profile ID to ensure entry for.
     */
    private async getOrCreateProfileData(
        profileId: string,
    ): Promise<ProfileExclusionsEntry> {
        const existing = this.profileDataMap.get(profileId);
        if (existing) {
            return existing;
        }

        const loadPromise = (async (): Promise<ProfileExclusionsEntry> => {
            const settings = profilesService.getProfileSettings(profileId);
            const { exclusions } = settings;
            const { inverted } = exclusions;

            const regularModeHandler = new ExclusionsHandler(
                this.saveProfileExclusions.bind(this, profileId),
                exclusions[ExclusionsMode.Regular] ?? [],
                ExclusionsMode.Regular,
            );
            const selectiveModeHandler = new ExclusionsHandler(
                this.saveProfileExclusions.bind(this, profileId),
                exclusions[ExclusionsMode.Selective] ?? [],
                ExclusionsMode.Selective,
            );

            const entry: ProfileExclusionsEntry = {
                handlers: {
                    regularModeHandler,
                    selectiveModeHandler,
                },
                inverted,
                tree: new ExclusionsTree(),
            };

            await this.updateTreeForProfile(entry);

            return entry;
        })();

        this.profileDataMap.set(profileId, loadPromise);

        try {
            return await loadPromise;
        } catch (error) {
            this.profileDataMap.delete(profileId);
            throw error;
        }
    }

    /**
     * Persists the current exclusions state for a profile.
     *
     * @param profileId Profile ID to save exclusions for.
     */
    private async saveProfileExclusions(profileId: string): Promise<void> {
        const profileEntry = await this.profileDataMap.get(profileId);
        if (!profileEntry) {
            throw new Error(`[vpn.ExclusionsService]: Profile entry not found for id: ${profileId}`);
        }

        const exclusionsData: PersistedExclusions = {
            inverted: profileEntry.inverted,
            [ExclusionsMode.Selective]: profileEntry.handlers.selectiveModeHandler.exclusions,
            [ExclusionsMode.Regular]: profileEntry.handlers.regularModeHandler.exclusions,
        };

        await profilesService.updateProfileSettings(
            profileId,
            { exclusions: exclusionsData },
            async () => {
                await this.updateProxyForActiveProfile();
            },
        );
    }

    /**
     * Updates the proxy bypass list based on the active profile's exclusions.
     */
    private async updateProxyForActiveProfile(): Promise<void> {
        const activeProfileId = profilesService.getActiveProfileId();
        const entry = await this.profileDataMap.get(activeProfileId);
        if (!entry) {
            return;
        }

        const currentModeHandler = getCurrentModeHandler(entry);
        const enabledExclusions = currentModeHandler.exclusions
            .filter(({ state }) => state === ExclusionState.Enabled)
            .map(({ hostname }) => hostname);

        notifier.notifyListeners(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE);
        await proxy.setBypassList(enabledExclusions, entry.inverted);
    }

    /**
     * Returns a context for performing exclusion operations on a specific profile.
     *
     * @param profileId Profile ID.
     */
    private async getProfileContext(profileId: string): Promise<ProfileExclusionsContext> {
        const entry = await this.getOrCreateProfileData(profileId);

        return {
            profileId,
            entry,
            handlers: entry.handlers,
            currentModeHandler: getCurrentModeHandler(entry),
            tree: entry.tree,
            updateTree: () => this.updateTreeForProfile(entry),
        };
    }

    /**
     * Builds or refreshes the tree for a given profile.
     *
     * @param entry Profile exclusions entry containing handlers and tree.
     */
    private async updateTreeForProfile(
        entry: ProfileExclusionsEntry,
    ): Promise<void> {
        const services = await servicesManager.getServices();
        const indexedServices = await servicesManager.getIndexedServices();
        const currentModeHandler = getCurrentModeHandler(entry);
        entry.tree.generateTree({
            exclusions: currentModeHandler.exclusions,
            indexedExclusions: currentModeHandler.getIndexedExclusions(),
            services,
            indexedServices,
        });
    }

    /**
     * Retrieves current exclusions mode.
     *
     * @param profileId Profile ID.
     * @returns Current exclusions mode.
     */
    public async getMode(profileId: string): Promise<ExclusionsMode> {
        const ctx = await this.getProfileContext(profileId);
        return ctx.currentModeHandler.mode;
    }

    /**
     * Sets exclusions mode.
     *
     * @param profileId Profile ID.
     * @param mode New exclusions mode to set.
     * @param shouldNotifyOptionsPage Whether to notify the options page about the change.
     */
    public async setMode(
        profileId: string,
        mode: ExclusionsMode,
        shouldNotifyOptionsPage?: boolean,
    ): Promise<void> {
        const ctx = await this.getProfileContext(profileId);

        ctx.entry.inverted = mode === ExclusionsMode.Selective;

        await this.saveProfileExclusions(ctx.profileId);
        await ctx.updateTree();

        // shouldNotifyOptionsPage flag is used to notify options page to update exclusions data,
        // if exclusion mode was changed from context menu
        if (shouldNotifyOptionsPage) {
            notifier.notifyListeners(notifier.types.EXCLUSIONS_DATA_UPDATED);
        }
    }

    /**
     * Force-refreshes the services catalogue from the server and rebuilds
     * exclusion trees for every loaded profile. Called when the user
     * changes locale or manually triggers a refresh, bypassing the
     * normal TTL-based cache in ServicesManager.
     */
    public async forceUpdateServices(): Promise<void> {
        await servicesManager.updateServices();

        await Promise.all(
            Array.from(this.profileDataMap.values()).map(async (entryPromise) => {
                const entry = await entryPromise;
                return this.updateTreeForProfile(entry);
            }),
        );
    }

    /**
     * Retrieves services with their current states for a profile.
     *
     * @param profileId Profile ID.
     * @returns List of services with their states.
     */
    public async getServices(profileId: string): Promise<ServiceDto[]> {
        const ctx = await this.getProfileContext(profileId);
        const services = await servicesManager.getServicesDto();

        return services.map((service) => {
            const state = ctx.tree.getExclusionState(service.serviceId);
            return {
                ...service,
                state: state ?? ExclusionState.Disabled,
            };
        });
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
     * @param profileId Profile ID.
     * @param url URL to add to exclusions.
     *
     * @return Amount of added exclusions.
     */
    public async addUrlToExclusions(profileId: string, url: string): Promise<number> {
        const ctx = await this.getProfileContext(profileId);

        const hostname = getHostname(url);

        if (!hostname) {
            return 0;
        }

        await this.savePreviousExclusions(ctx);

        const { currentModeHandler } = ctx;

        // if provided url is existing exclusion, enables it
        const existingExclusion = currentModeHandler.getExclusionByHostname(hostname);
        if (existingExclusion) {
            await currentModeHandler.enableExclusion(existingExclusion.id);
            await ctx.updateTree();
            return 0;
        }

        // add service manually by domain
        const services = await servicesManager.getServicesDto();
        const serviceData = services.find((service) => service.domains.includes(hostname));
        if (serviceData) {
            // get list of existing exclusions in service to keep their state
            const existingExclusionsIds = ctx.tree
                .getPathExclusions(serviceData.serviceId);

            const addedExclusionsCount = await this.addServices(
                [serviceData.serviceId],
                ctx,
            );

            // disable all exclusions in service except existing
            let exclusionsToDisable = ctx.tree
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

            await ctx.updateTree();
            return addedExclusionsCount;
        }

        // if provided url is IP-address, adds ip exclusion
        if (isIP(hostname)) {
            await currentModeHandler.addUrlToExclusions(hostname);
            await ctx.updateTree();
            return 1;
        }

        const eTld = getETld(hostname);

        if (!eTld) {
            return 0;
        }

        if (currentModeHandler.hasETld(eTld)) {
            await currentModeHandler.addExclusions([{ value: hostname }]);
            await ctx.updateTree();
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
                await ctx.updateTree();
                return 2;
            }

            const wildcardHostname = `*.${eTld}`;
            const subdomainHostname = `${subdomain}.${eTld}`;
            await currentModeHandler.addExclusions([
                { value: eTld, enabled: false },
                { value: wildcardHostname, enabled: false },
                { value: subdomainHostname, enabled: true },
            ]);
            await ctx.updateTree();
            return 3;
        }

        const wildcardHostname = `*.${hostname}`;
        await currentModeHandler.addExclusions([
            { value: hostname },
            { value: wildcardHostname },
        ]);
        await ctx.updateTree();
        return 2;
    }

    /**
     * Adds services to exclusions and returns amount of added exclusions.
     *
     * @param serviceIds List of service IDs to add.
     * @param ctx Profile context to operate on.
     *
     * @returns Amount of added exclusions.
     */
    private async addServices(
        serviceIds: string[],
        ctx: ProfileExclusionsContext,
    ): Promise<number> {
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

        await ctx.currentModeHandler.addExclusions(servicesDomainsWithWildcards);

        await ctx.updateTree();
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
     * @param profileId Profile ID.
     * @param id Exclusion id to remove.
     *
     * @returns Amount of removed exclusions.
     */
    public async removeExclusion(profileId: string, id: string): Promise<number> {
        const ctx = await this.getProfileContext(profileId);
        await this.savePreviousExclusions(ctx);

        let exclusionsToRemove = ctx.tree.getPathExclusions(id);
        const exclusionNode = ctx.tree.getExclusionNode(id);
        const parentNode = ctx.tree.getParentExclusionNode(id);

        if (parentNode?.type === ExclusionsType.Group && ExclusionsService.isBasicExclusion(exclusionNode)) {
            exclusionsToRemove = ctx.tree.getPathExclusions(parentNode.id);
        }

        await ctx.currentModeHandler.removeExclusions(exclusionsToRemove);

        await ctx.updateTree();

        return exclusionsToRemove.length;
    }

    /**
     * Toggles exclusion state.
     *
     * @param profileId Profile ID.
     * @param id Exclusion id to toggle.
     */
    public async toggleExclusionState(profileId: string, id: string): Promise<void> {
        const ctx = await this.getProfileContext(profileId);

        const targetExclusionState = ctx.tree.getExclusionState(id);
        if (!targetExclusionState) {
            throw new Error(`There is no such id in the tree: ${id}`);
        }

        const exclusionsToToggle = ctx.tree.getPathExclusions(id);

        const state = targetExclusionState === ExclusionState.Disabled
            ? ExclusionState.Enabled
            : ExclusionState.Disabled;

        await ctx.currentModeHandler.setExclusionsState(exclusionsToToggle, state);

        await ctx.updateTree();
    }

    /**
     * Removes exclusions for current mode.
     *
     * @param profileId Profile ID.
     */
    public async clearExclusionsData(profileId: string): Promise<void> {
        const ctx = await this.getProfileContext(profileId);
        await this.savePreviousExclusions(ctx);
        await ctx.currentModeHandler.clearExclusionsData();

        await ctx.updateTree();
    }

    /**
     * Adds/removes services by provided ids.
     *
     * @param profileId Profile ID.
     * @param servicesIds Service IDs to toggle.
     *
     * @returns Added and removed exclusions count.
     */
    public async toggleServices(
        profileId: string,
        servicesIds: string[],
    ): Promise<ToggleServicesResult> {
        const ctx = await this.getProfileContext(profileId);

        const servicesIdsToRemove = servicesIds.filter((id) => {
            const exclusionNode = ctx.tree.getExclusionNode(id);
            return !!exclusionNode;
        });

        const exclusionsToRemove = servicesIdsToRemove.map((id) => {
            return ctx.tree.getPathExclusions(id);
        }).flat();

        const servicesIdsToAdd = servicesIds.filter((id) => {
            const exclusionNode = ctx.tree.getExclusionNode(id);
            return !exclusionNode;
        });

        if (exclusionsToRemove.length === 0 && servicesIdsToAdd.length === 0) {
            return { added: 0, deleted: 0 };
        }

        await this.savePreviousExclusions(ctx);

        await ctx.currentModeHandler.removeExclusions(exclusionsToRemove);

        const addedExclusionsCount = await this.addServices(servicesIdsToAdd, ctx);

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
        const profileId = profilesService.getActiveProfileId();
        const ctx = await this.getProfileContext(profileId);
        if (ctx.currentModeHandler.mode === ExclusionsMode.Selective) {
            await ctx.currentModeHandler.disableExclusionByUrl(url);
            await ctx.updateTree();
        } else {
            await this.addUrlToExclusions(profileId, url);
        }
        notifier.notifyListeners(notifier.types.EXCLUSIONS_DATA_UPDATED);
    }

    /**
     * Enables vpn for provided url.
     *
     * @param url URL to enable VPN for.
     */
    public async enableVpnByUrl(url: string): Promise<void> {
        const profileId = profilesService.getActiveProfileId();
        const ctx = await this.getProfileContext(profileId);
        if (ctx.currentModeHandler.mode === ExclusionsMode.Selective) {
            await this.addUrlToExclusions(profileId, url);
        } else {
            await ctx.currentModeHandler.disableExclusionByUrl(url);
            await ctx.updateTree();
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
    public async isVpnEnabledByUrl(url: string | null): Promise<boolean> {
        if (!url) {
            return true;
        }

        const profileId = profilesService.getActiveProfileId();
        const ctx = await this.getProfileContext(profileId);
        const { currentModeHandler } = ctx;
        const isExcluded = currentModeHandler.isExcluded(punycode.toASCII(url));
        return currentModeHandler.mode === ExclusionsMode.Selective ? isExcluded : !isExcluded;
    }

    /**
     * Checks if exclusions are inverted or not.
     *
     * @param profileId Profile ID.
     *
     * @returns True if exclusions are inverted, false otherwise.
     */
    public async isInverted(profileId: string): Promise<boolean> {
        const ctx = await this.getProfileContext(profileId);
        return ctx.currentModeHandler.mode === ExclusionsMode.Selective;
    }

    /**
     * Resets services data:
     * restores exclusions groups for service domains
     * enables main domain exclusions and all subdomains exclusions
     * doesn't affect for manually added subdomains.
     *
     * @param profileId Profile ID.
     * @param id Service id to reset data for.
     */
    public async resetServiceData(profileId: string, id: string): Promise<void> {
        const ctx = await this.getProfileContext(profileId);
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

        await ctx.currentModeHandler.addExclusions(exclusionsToAdd);

        await ctx.updateTree();
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
     * @param profileId Profile ID.
     * @returns String with regular exclusions hostnames separated by new line.
     */
    public async getRegularExclusions(profileId: string): Promise<string> {
        const ctx = await this.getProfileContext(profileId);
        const { exclusions } = ctx.handlers.regularModeHandler;
        return this.prepareExclusionsForExport(exclusions);
    }

    /**
     * Retrieves selective exclusions for export.
     *
     * @param profileId Profile ID.
     * @returns String with selective exclusions hostnames separated by new line.
     */
    public async getSelectiveExclusions(profileId: string): Promise<string> {
        const ctx = await this.getProfileContext(profileId);
        const { exclusions } = ctx.handlers.selectiveModeHandler;
        return this.prepareExclusionsForExport(exclusions);
    }

    /**
     * Adds provided exclusions to the general list
     * and returns amount of added exclusions.
     *
     * @param profileId Profile ID.
     * @param exclusions List of exclusions to add.
     *
     * @returns Amount of added exclusions.
     */
    public async addGeneralExclusions(profileId: string, exclusions: string[]): Promise<number> {
        const ctx = await this.getProfileContext(profileId);
        await this.savePreviousExclusions(ctx);

        const exclusionsWithState = await this.supplementExclusions(exclusions);
        const { regularModeHandler } = ctx.handlers;
        const addedCount = await regularModeHandler.addExclusions(exclusionsWithState);

        await ctx.updateTree();

        return addedCount;
    }

    /**
     * Adds provided exclusions to the selective list
     * and returns amount of added exclusions.
     *
     * @param profileId Profile ID.
     * @param exclusions List of exclusions to add.
     *
     * @returns Amount of added exclusions.
     */
    public async addSelectiveExclusions(profileId: string, exclusions: string[]): Promise<number> {
        const ctx = await this.getProfileContext(profileId);
        await this.savePreviousExclusions(ctx);

        const exclusionsWithState = await this.supplementExclusions(exclusions);
        const { selectiveModeHandler } = ctx.handlers;
        const addedCount = await selectiveModeHandler.addExclusions(exclusionsWithState);

        await ctx.updateTree();

        return addedCount;
    }

    /**
     * Adds provided exclusions to the both lists (regular and selective).
     *
     * @param profileId Profile ID.
     * @param exclusionsMap Map of exclusions to add to both lists.
     *
     * @returns Total amount of added exclusions.
     */
    public async addExclusionsMap(profileId: string, exclusionsMap: ExclusionsMap): Promise<number> {
        const ctx = await this.getProfileContext(profileId);
        await this.savePreviousExclusions(ctx);

        const { regularModeHandler, selectiveModeHandler } = ctx.handlers;

        const regularExclusionsWithState = await this.supplementExclusions(exclusionsMap[ExclusionsMode.Regular]);
        const addedRegularCount = await regularModeHandler.addExclusions(regularExclusionsWithState);

        const selectiveExclusionsWithState = await this.supplementExclusions(exclusionsMap[ExclusionsMode.Selective]);
        const addedSelectiveCount = await selectiveModeHandler.addExclusions(selectiveExclusionsWithState);

        await ctx.updateTree();
        return addedRegularCount + addedSelectiveCount;
    }

    /**
     * Saves current exclusions snapshot for undo.
     *
     * @param ctx Profile context to save snapshot for.
     */
    private async savePreviousExclusions(ctx: ProfileExclusionsContext): Promise<void> {
        const { regularModeHandler, selectiveModeHandler } = ctx.handlers;
        const snapshot: ExclusionsSnapshot = {
            regular: structuredClone(regularModeHandler.exclusions),
            selective: structuredClone(selectiveModeHandler.exclusions),
        };

        const state = await this.exclusionsState.get();
        await this.exclusionsState.update({
            previousExclusionsMap: {
                ...state.previousExclusionsMap,
                [ctx.profileId]: snapshot,
            },
        });
    }

    /**
     * Restores previous exclusions.
     *
     * @param profileId Profile ID.
     */
    public async restoreExclusions(profileId: string): Promise<void> {
        const ctx = await this.getProfileContext(profileId);
        const state = await this.exclusionsState.get();
        const previousExclusionsMap = state.previousExclusionsMap ?? {};
        const snapshot = previousExclusionsMap[ctx.profileId];

        if (!snapshot) {
            return;
        }

        const { regularModeHandler, selectiveModeHandler } = ctx.handlers;
        await regularModeHandler.setExclusions(snapshot.regular);
        await selectiveModeHandler.setExclusions(snapshot.selective);
        await ctx.updateTree();

        const nextMap = Object.fromEntries(
            Object.entries(previousExclusionsMap).filter(([id]) => id !== ctx.profileId),
        );
        await this.exclusionsState.update({ previousExclusionsMap: nextMap });
    }
}
