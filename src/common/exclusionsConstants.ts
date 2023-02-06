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

export const ICON_FOR_DOMAIN = 'https://icons.adguardvpn.com/icon?domain=';
