import { ExclusionState } from '../../../common/exclusionsConstants';

export interface ExclusionInterface {
    id: string,
    hostname: string,
    state: Exclude<ExclusionState, ExclusionState.PartlyEnabled>,
}

export interface IndexedExclusionsInterface {
    [id: string]: string[];
}
