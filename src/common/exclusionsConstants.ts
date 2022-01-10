// Extracted in the separate file because these entities are also used in the options page

export enum ExclusionsModes {
    Selective = 'selective',
    Regular = 'regular',
}

export enum ExclusionState {
    Enabled = 'Enabled',
    PartlyEnabled = 'PartlyEnabled',
    Disabled = 'Disabled',
}

export enum ExclusionsTypes {
    Service = 'Service',
    Group = 'Group',
    Exclusion = 'Exclusion',
}

export interface ExclusionDtoInterface {
    id: string;

    hostname: string;

    state: ExclusionState;

    iconUrl?: string;

    type: ExclusionsTypes

    children: ExclusionDtoInterface[];
}

export interface ExclusionsData {
    exclusions: ExclusionDtoInterface[];
    currentMode: ExclusionsModes;
}

export interface ServiceCategory {
    id: string,
    name: string,
}

export interface ServiceInterface {
    serviceId: string;
    serviceName: string;
    iconUrl: string;
    modifiedTime: string;
    categories: ServiceCategory[];
    domains: string[];
}

export interface ServiceDto {
    serviceId: string,
    serviceName: string,
    iconUrl: string,
    state?: ExclusionState,
    categories: ServiceCategory[],
    domains: string[],
}

export const ICON_FOR_DOMAIN = 'https://icons.adguard.org/icon?domain=';
