import punycode from 'punycode';

import { isIP } from 'is-ip';

import {
    type ExclusionDtoInterface,
    ExclusionsMode,
    ExclusionState,
    ExclusionsType,
    type ServiceDto,
} from '../../common/exclusionsConstants';
import { type PersistedExclusions } from '../schema';
import {
    getETld,
    getHostname,
    getSubdomain,
    isWildcard,
} from '../../common/utils/url';
import { notifier } from '../../common/notifier';
import { profilesService } from '../profiles';
import { proxy } from '../proxy';

import { ExclusionsHandler } from './exclusions/ExclusionsHandler';
import { servicesManager } from './services/ServicesManager';
import { ExclusionsTree } from './ExclusionsTree';
import { type ExclusionNode } from './ExclusionNode';
import { ExclusionsImportExport } from './ExclusionsImportExport';
import { ExclusionsUndoManager } from './ExclusionsUndoManager';

/**
 * Result of toggling services operation.
 */
export interface ToggleServicesResult {
    added: number;
    deleted: number;
}

/**
 * Response data for getting exclusions information.
 */
export interface GetExclusionsDataResponse {
    /**
     * Contains exclusions list and current mode.
     */
    exclusionsData: {
        exclusions: ExclusionDtoInterface;
        currentMode: ExclusionsMode;
    };
    /**
     * List of available services with exclusions.
     */
    services: ServiceDto[];
    /**
     * Whether all exclusion lists are empty.
     */
    isAllExclusionsListsEmpty: boolean;
}

/**
 * Map of exclusions organized by mode.
 *
 * @property Selective Array of URLs for selective mode exclusions.
 * @property Regular Array of URLs for regular mode exclusions.
 */
export interface ExclusionsMap {
    [ExclusionsMode.Selective]: string[],
    [ExclusionsMode.Regular]: string[],
}

/**
 * Handlers for different exclusion modes of a profile.
 */
export interface ExclusionsHandlers {
    /**
     * Regular mode exclusions handler.
     */
    regularModeHandler: ExclusionsHandler;

    /**
     * Selective mode exclusions handler.
     */
    selectiveModeHandler: ExclusionsHandler;

    /**
     * Current mode exclusions handler.
     */
    currentModeHandler: ExclusionsHandler;
}

/**
 * Combined per-profile exclusions data: handlers, inverted flag, and tree.
 */
interface ProfileExclusionsEntry {
    handlers: ExclusionsHandlers;
    inverted: boolean;
    tree: ExclusionsTree;
}

/**
 * Context for performing exclusion operations on a specific profile.
 */
export interface ProfileExclusionsContext {
    profileId: string;
    handlers: ExclusionsHandlers;
    tree: ExclusionsTree;
    updateTree: () => Promise<void>;
}

export class ExclusionsService {
    /**
     * Manages undo snapshots for exclusion mutations.
     */
    private undoManager = new ExclusionsUndoManager();

    /**
     * Handles importing and exporting exclusions.
     */
    public importExport = new ExclusionsImportExport(
        this.getProfileContext.bind(this),
        this.savePreviousExclusions.bind(this),
    );

    /**
     * Per-profile exclusions data (handlers, inverted flag, tree).
     */
    private profileDataMap = new Map<string, ProfileExclusionsEntry>();

    /**
     * Initializes the exclusions service by loading handlers for the active profile.
     */
    public async init(): Promise<void> {
        await servicesManager.init();

        const activeProfileId = await profilesService.getActiveProfileId();
        await this.ensureProfileData(activeProfileId);

        // Initial proxy update
        await this.updateProxyForActiveProfile();

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
     * Retrieves exclusions from the active profile's exclusions tree.
     *
     * @returns Serializable exclusions data.
     */
    public async getExclusions(): Promise<ExclusionDtoInterface> {
        const ctx = await this.getProfileContext();
        return ctx.tree.getExclusions();
    }

    /**
     * Retrieves full exclusions data for a profile.
     * If no profileId is provided, uses the active profile.
     *
     * @param profileId Profile ID to get exclusions data for.
     */
    public async getExclusionsDataForProfile(profileId?: string): Promise<GetExclusionsDataResponse> {
        const ctx = await this.getProfileContext(profileId);
        const { currentModeHandler, regularModeHandler, selectiveModeHandler } = ctx.handlers;

        let services = await servicesManager.getServicesDto();
        services = services.map((service) => {
            const serviceState = ctx.tree.getExclusionState(service.serviceId);
            return {
                ...service,
                state: serviceState ?? ExclusionState.Disabled,
            };
        });

        const enabledRegular = regularModeHandler.exclusions
            .filter(({ state }) => state === ExclusionState.Enabled).length;
        const enabledSelective = selectiveModeHandler.exclusions
            .filter(({ state }) => state === ExclusionState.Enabled).length;

        return {
            exclusionsData: {
                exclusions: ctx.tree.getExclusions(),
                currentMode: currentModeHandler.mode,
            },
            services,
            isAllExclusionsListsEmpty: !enabledRegular && !enabledSelective,
        };
    }

    /**
     * Creates or retrieves the exclusions entry for a profile.
     * Entries are cached in profileDataMap and reused across calls.
     *
     * @param profileId Profile ID to ensure entry for.
     */
    private async ensureProfileData(profileId: string): Promise<ProfileExclusionsEntry> {
        const existing = this.profileDataMap.get(profileId);
        if (existing) {
            return existing;
        }

        const settings = await profilesService.getProfileSettings(profileId);
        const { exclusions } = settings;
        const inverted = exclusions.inverted ?? false;

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

        const currentModeHandler = inverted ? selectiveModeHandler : regularModeHandler;

        const entry: ProfileExclusionsEntry = {
            handlers: {
                regularModeHandler,
                selectiveModeHandler,
                currentModeHandler,
            },
            inverted,
            tree: new ExclusionsTree(),
        };

        this.profileDataMap.set(profileId, entry);

        await this.updateTreeForProfile(entry);

        return entry;
    }

    /**
     * Persists the current exclusions state for a profile.
     *
     * @param profileId Profile ID to save exclusions for.
     */
    private async saveProfileExclusions(profileId: string): Promise<void> {
        const profileEntry = this.profileDataMap.get(profileId);
        if (!profileEntry) {
            return;
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
        const activeProfileId = await profilesService.getActiveProfileId();
        const entry = this.profileDataMap.get(activeProfileId);
        if (!entry) {
            return;
        }

        const enabledExclusions = entry.handlers.currentModeHandler.exclusions
            .filter(({ state }) => state === ExclusionState.Enabled)
            .map(({ hostname }) => hostname);

        notifier.notifyListeners(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE);
        await proxy.setBypassList(enabledExclusions, entry.inverted);
    }

    /**
     * Returns a context for performing exclusion operations on a specific profile.
     *
     * @param profileId Profile ID. If undefined, uses the active profile.
     */
    private async getProfileContext(profileId?: string): Promise<ProfileExclusionsContext> {
        const resolvedId = await profilesService.resolveProfileId(profileId);
        const entry = await this.ensureProfileData(resolvedId);

        return {
            profileId: resolvedId,
            handlers: entry.handlers,
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
        entry.tree.generateTree({
            exclusions: entry.handlers.currentModeHandler.exclusions,
            indexedExclusions: entry.handlers.currentModeHandler.getIndexedExclusions(),
            services: await servicesManager.getServices(),
            indexedServices: await servicesManager.getIndexedServices(),
        });
    }

    /**
     * Retrieves current exclusions mode.
     *
     * @returns Current exclusions mode.
     */
    public async getMode(): Promise<ExclusionsMode> {
        const resolvedId = await profilesService.resolveProfileId();
        const { handlers } = await this.ensureProfileData(resolvedId);
        return handlers.currentModeHandler.mode;
    }

    /**
     * Sets exclusions mode.
     *
     * @param mode New exclusions mode to set.
     * @param shouldNotifyOptionsPage Whether to notify the options page about the change.
     * @param profileId Profile ID. If undefined, uses the active profile.
     */
    public async setMode(
        mode: ExclusionsMode,
        shouldNotifyOptionsPage?: boolean,
        profileId?: string,
    ): Promise<void> {
        const resolvedId = await profilesService.resolveProfileId(profileId);
        const entry = await this.ensureProfileData(resolvedId);

        const inverted = mode === ExclusionsMode.Selective;
        entry.inverted = inverted;

        entry.handlers.currentModeHandler = inverted
            ? entry.handlers.selectiveModeHandler
            : entry.handlers.regularModeHandler;

        // Persist the inverted flag
        const exclusionsData: PersistedExclusions = {
            inverted,
            [ExclusionsMode.Selective]: entry.handlers.selectiveModeHandler.exclusions,
            [ExclusionsMode.Regular]: entry.handlers.regularModeHandler.exclusions,
        };

        await profilesService.updateProfileSettings(
            resolvedId,
            { exclusions: exclusionsData },
            async () => {
                await this.updateProxyForActiveProfile();
            },
        );

        await this.updateTreeForProfile(entry);

        if (shouldNotifyOptionsPage) {
            notifier.notifyListeners(notifier.types.EXCLUSIONS_DATA_UPDATED);
        }
    }

    /**
     * Updates the exclusions tree for the active profile.
     */
    private async updateTree(): Promise<void> {
        const resolvedId = await profilesService.resolveProfileId();
        const entry = await this.ensureProfileData(resolvedId);
        await this.updateTreeForProfile(entry);
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
        const ctx = await this.getProfileContext();
        let services = await servicesManager.getServicesDto();

        services = services.map((service) => {
            const state = ctx.tree.getExclusionState(service.serviceId);
            return {
                ...service,
                state: state ?? ExclusionState.Disabled,
            };
        });

        return services;
    }

    /**
     * Adds url to exclusions and returns amount of added exclusions.
     *
     * @param url URL to add to exclusions.
     * @param profileId Profile ID. If undefined, uses the active profile.
     *
     * @return Amount of added exclusions.
     */
    public async addUrlToExclusions(url: string, profileId?: string): Promise<number> {
        const ctx = await this.getProfileContext(profileId);
        await this.savePreviousExclusions(ctx);

        const hostname = getHostname(url);

        if (!hostname) {
            return 0;
        }

        const { currentModeHandler } = ctx.handlers;

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

            const addedExclusionsCount = await this.addServicesWithContext(
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
     *
     * @returns Amount of added exclusions.
     */
    /**
     * Adds services to exclusions and returns amount of added exclusions.
     *
     * @param serviceIds List of service IDs to add.
     * @param ctx Profile context to operate on.
     *
     * @returns Amount of added exclusions.
     */
    private async addServicesWithContext(
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

        const { currentModeHandler } = ctx.handlers;
        await currentModeHandler.addExclusions(servicesDomainsWithWildcards);

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
     * @param id Exclusion id to remove.
     * @param profileId Profile ID. If undefined, uses the active profile.
     *
     * @returns Amount of removed exclusions.
     */
    public async removeExclusion(id: string, profileId?: string): Promise<number> {
        const ctx = await this.getProfileContext(profileId);
        await this.savePreviousExclusions(ctx);

        let exclusionsToRemove = ctx.tree.getPathExclusions(id);
        const exclusionNode = ctx.tree.getExclusionNode(id);
        const parentNode = ctx.tree.getParentExclusionNode(id);

        if (parentNode?.type === ExclusionsType.Group && ExclusionsService.isBasicExclusion(exclusionNode)) {
            exclusionsToRemove = ctx.tree.getPathExclusions(parentNode.id);
        }

        const { currentModeHandler } = ctx.handlers;
        await currentModeHandler.removeExclusions(exclusionsToRemove);

        await ctx.updateTree();

        return exclusionsToRemove.length;
    }

    /**
     * Toggles exclusion state.
     *
     * @param id Exclusion id to toggle.
     * @param profileId Profile ID. If undefined, uses the active profile.
     */
    public async toggleExclusionState(id: string, profileId?: string): Promise<void> {
        const ctx = await this.getProfileContext(profileId);

        const targetExclusionState = ctx.tree.getExclusionState(id);
        if (!targetExclusionState) {
            throw new Error(`There is no such id in the tree: ${id}`);
        }

        const exclusionsToToggle = ctx.tree.getPathExclusions(id);

        const state = targetExclusionState === ExclusionState.Disabled
            ? ExclusionState.Enabled
            : ExclusionState.Disabled;

        const { currentModeHandler } = ctx.handlers;
        await currentModeHandler.setExclusionsState(exclusionsToToggle, state);

        await ctx.updateTree();
    }

    /**
     * Removes exclusions for current mode.
     *
     * @param profileId Profile ID. If undefined, uses the active profile.
     */
    public async clearExclusionsData(profileId?: string): Promise<void> {
        const ctx = await this.getProfileContext(profileId);
        await this.savePreviousExclusions(ctx);
        const { currentModeHandler } = ctx.handlers;
        await currentModeHandler.clearExclusionsData();

        await ctx.updateTree();
    }

    /**
     * Adds/removes services by provided ids.
     *
     * @param servicesIds Service IDs to toggle.
     * @param profileId Profile ID. If undefined, uses the active profile.
     *
     * @returns Added and removed exclusions count.
     */
    public async toggleServices(
        servicesIds: string[],
        profileId?: string,
    ): Promise<ToggleServicesResult> {
        const ctx = await this.getProfileContext(profileId);
        await this.savePreviousExclusions(ctx);

        const servicesIdsToRemove = servicesIds.filter((id) => {
            const exclusionNode = ctx.tree.getExclusionNode(id);
            return !!exclusionNode;
        });

        const exclusionsToRemove = servicesIdsToRemove.map((id) => {
            return ctx.tree.getPathExclusions(id);
        }).flat();

        const { currentModeHandler } = ctx.handlers;
        await currentModeHandler.removeExclusions(exclusionsToRemove);

        const servicesIdsToAdd = servicesIds.filter((id) => {
            const exclusionNode = ctx.tree.getExclusionNode(id);
            return !exclusionNode;
        });

        const addedExclusionsCount = await this.addServicesWithContext(servicesIdsToAdd, ctx);

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
            const resolvedId = await profilesService.resolveProfileId();
            const { handlers: { currentModeHandler } } = await this.ensureProfileData(resolvedId);
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
            const resolvedId = await profilesService.resolveProfileId();
            const { handlers: { currentModeHandler } } = await this.ensureProfileData(resolvedId);
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
    public async isVpnEnabledByUrl(url: string | null): Promise<boolean> {
        const resolvedId = await profilesService.resolveProfileId();
        const entry = this.profileDataMap.get(resolvedId);
        if (!url || !entry) {
            return true;
        }

        const { currentModeHandler } = entry.handlers;
        const isExcluded = currentModeHandler.isExcluded(punycode.toASCII(url));
        return await this.isInverted() ? isExcluded : !isExcluded;
    }

    /**
     * Checks if exclusions are inverted or not.
     *
     * @param profileId Profile ID. If undefined, uses the active profile.
     *
     * @returns True if exclusions are inverted, false otherwise.
     */
    public async isInverted(profileId?: string): Promise<boolean> {
        const resolvedId = await profilesService.resolveProfileId(profileId);

        const entry = this.profileDataMap.get(resolvedId);
        if (entry) {
            return entry.inverted;
        }

        // Not loaded yet — load from storage
        const loaded = await this.ensureProfileData(resolvedId);
        return loaded.inverted;
    }

    /**
     * Resets services data:
     * restores exclusions groups for service domains
     * enables main domain exclusions and all subdomains exclusions
     * doesn't affect for manually added subdomains.
     *
     * @param id Service id to reset data for.
     * @param profileId Profile ID. If undefined, uses the active profile.
     */
    public async resetServiceData(id: string, profileId?: string): Promise<void> {
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

        const ctx = await this.getProfileContext(profileId);
        const { currentModeHandler } = ctx.handlers;
        await currentModeHandler.addExclusions(exclusionsToAdd);

        await ctx.updateTree();
    }

    /**
     * Checks if both exclusions lists are empty.
     *
     * @returns True if both regular and selective exclusions lists are empty, false otherwise.
     */
    public async isAllExclusionListEmpty(): Promise<boolean> {
        const resolvedId = await profilesService.resolveProfileId();
        const {
            handlers: {
                regularModeHandler: { exclusions: regularExclusions },
                selectiveModeHandler: { exclusions: selectiveExclusions },
            },
        } = await this.ensureProfileData(resolvedId);

        const enabledRegularExclusionsCount = regularExclusions
            .reduce((count, { state }) => (state === ExclusionState.Enabled ? count + 1 : count), 0);
        const enabledSelectiveExclusionsCount = selectiveExclusions
            .reduce((count, { state }) => (state === ExclusionState.Enabled ? count + 1 : count), 0);

        return !enabledRegularExclusionsCount && !enabledSelectiveExclusionsCount;
    }

    /**
     * Saves the current exclusions snapshot for a profile before a mutation,
     * so it can be restored later via {@link restoreExclusions}.
     *
     * @param ctx Profile context whose handlers provide the current exclusions.
     */
    private async savePreviousExclusions(ctx: ProfileExclusionsContext): Promise<void> {
        const { regularModeHandler, selectiveModeHandler } = ctx.handlers;
        await this.undoManager.saveSnapshot(
            ctx.profileId,
            regularModeHandler.exclusions,
            selectiveModeHandler.exclusions,
        );
    }

    /**
     * Restores previous exclusions for a profile.
     *
     * @param profileId Profile ID. If undefined, uses the active profile.
     */
    public async restoreExclusions(profileId?: string): Promise<void> {
        const ctx = await this.getProfileContext(profileId);
        const snapshot = await this.undoManager.popSnapshot(ctx.profileId);

        if (snapshot) {
            const { regularModeHandler, selectiveModeHandler } = ctx.handlers;
            await regularModeHandler.setExclusions(snapshot.regular);
            await selectiveModeHandler.setExclusions(snapshot.selective);
            await ctx.updateTree();
        }
    }
}
