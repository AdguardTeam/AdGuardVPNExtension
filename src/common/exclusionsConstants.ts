// Extracted in the separate file because this variable is also used in the options page

export enum ExclusionsModes {
    Selective = 'selective',
    Regular = 'regular',
}

export enum ExclusionStates {
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

    value: string;

    state: ExclusionStates;

    iconUrl?: string;

    type: ExclusionsTypes

    children: ExclusionDtoInterface[];
}

export interface ExclusionsData {
    exclusions: ExclusionDtoInterface[];
    currentMode: ExclusionsModes;
}
