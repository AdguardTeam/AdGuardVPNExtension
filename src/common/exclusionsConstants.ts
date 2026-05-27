import type { ServiceCategory } from '../background/schema';

// Extracted in the separate file because these entities are also used in the options page

export enum ExclusionsMode {
    Selective = 'selective',
    Regular = 'regular',
}

export enum ExclusionState {
    Enabled = 'Enabled',
    PartlyEnabled = 'PartlyEnabled',
    Disabled = 'Disabled',
}

export enum ExclusionsType {
    Service = 'Service',
    Group = 'Group',
    Exclusion = 'Exclusion',
}

export interface ExclusionDtoInterface {
    id: string;
    parentId: string | null;
    hostname: string;
    state: ExclusionState;
    iconUrl?: string;
    type: ExclusionsType;
    children: ExclusionDtoInterface[];
}

export interface ExclusionsData {
    exclusions: ExclusionDtoInterface;
    currentMode: ExclusionsMode;
}

export interface ServiceDto {
    serviceId: string,
    serviceName: string,
    iconUrl: string,
    state?: ExclusionState,
    categories: ServiceCategory[],
    domains: string[],
}

/**
 * Result of toggling services operation.
 */
export interface ToggleServicesResult {
    /**
     * Number of exclusions added.
     */
    added: number;

    /**
     * Number of exclusions removed.
     */
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
