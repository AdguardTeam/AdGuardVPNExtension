import punycode from 'punycode';

import identity from 'lodash/identity';

import { ExclusionsMode, ExclusionState } from '../../common/exclusionsConstants';
import { type ExclusionInterface } from '../schema';
import {
    getETld,
    getHostname,
    getSubdomain,
    isWildcard,
} from '../../common/utils/url';

import { type AddExclusionArgs } from './exclusions/ExclusionsHandler';
import { servicesManager } from './services/ServicesManager';
import { type ExclusionsMap, type ProfileExclusionsContext } from './ExclusionsService';

/**
 * Callback that returns a profile context for exclusion operations.
 */
type GetProfileContext = (profileId?: string) => Promise<ProfileExclusionsContext>;

/**
 * Callback that saves an undo snapshot before a mutation.
 */
type SaveSnapshot = (ctx: ProfileExclusionsContext) => Promise<void>;

/**
 * Handles importing exclusions from external sources
 * and exporting exclusions for backup/sharing.
 */
export class ExclusionsImportExport {
    /**
     * Returns a profile context for exclusion operations.
     */
    private getProfileContext: GetProfileContext;

    /**
     * Saves an undo snapshot before a mutation.
     */
    private saveSnapshot: SaveSnapshot;

    constructor(getProfileContext: GetProfileContext, saveSnapshot: SaveSnapshot) {
        this.getProfileContext = getProfileContext;
        this.saveSnapshot = saveSnapshot;
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
        const ctx = await this.getProfileContext();
        return this.prepareExclusionsForExport(ctx.handlers.regularModeHandler.exclusions);
    }

    /**
     * Retrieves selective exclusions for export.
     *
     * @returns String with selective exclusions hostnames separated by new line.
     */
    public async getSelectiveExclusions(): Promise<string> {
        const ctx = await this.getProfileContext();
        return this.prepareExclusionsForExport(ctx.handlers.selectiveModeHandler.exclusions);
    }

    /**
     * Adds provided exclusions to the general list
     * and returns amount of added exclusions.
     *
     * @param exclusions List of exclusions to add.
     * @param profileId Profile ID. If undefined, uses the active profile.
     *
     * @returns Amount of added exclusions.
     */
    public async addGeneralExclusions(exclusions: string[], profileId?: string): Promise<number> {
        const ctx = await this.getProfileContext(profileId);
        await this.saveSnapshot(ctx);

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
     * @param exclusions List of exclusions to add.
     * @param profileId Profile ID. If undefined, uses the active profile.
     *
     * @returns Amount of added exclusions.
     */
    public async addSelectiveExclusions(exclusions: string[], profileId?: string): Promise<number> {
        const ctx = await this.getProfileContext(profileId);
        await this.saveSnapshot(ctx);

        const exclusionsWithState = await this.supplementExclusions(exclusions);
        const { selectiveModeHandler } = ctx.handlers;
        const addedCount = await selectiveModeHandler.addExclusions(exclusionsWithState);

        await ctx.updateTree();

        return addedCount;
    }

    /**
     * Adds provided exclusions to the both lists (regular and selective).
     *
     * @param exclusionsMap Map of exclusions to add to both lists.
     * @param profileId Profile ID. If undefined, uses the active profile.
     *
     * @returns Total amount of added exclusions.
     */
    public async addExclusionsMap(exclusionsMap: ExclusionsMap, profileId?: string): Promise<number> {
        const ctx = await this.getProfileContext(profileId);
        await this.saveSnapshot(ctx);

        const { regularModeHandler, selectiveModeHandler } = ctx.handlers;

        const regularExclusionsWithState = await this.supplementExclusions(exclusionsMap[ExclusionsMode.Regular]);
        const addedRegularCount = await regularModeHandler.addExclusions(regularExclusionsWithState);

        const selectiveExclusionsWithState = await this.supplementExclusions(exclusionsMap[ExclusionsMode.Selective]);
        const addedSelectiveCount = await selectiveModeHandler.addExclusions(selectiveExclusionsWithState);

        await ctx.updateTree();
        return addedRegularCount + addedSelectiveCount;
    }
}
