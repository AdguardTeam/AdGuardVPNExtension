import { ExclusionStates } from '../../../common/exclusionsConstants';

export interface ExclusionInterface {
    id: string,
    hostname: string,
    state: Exclude<ExclusionStates, ExclusionStates.PartlyEnabled>,
}

export interface IndexedExclusionsInterface {
    [id: string]: string[];
}
