import { ExclusionStates } from '../../../common/exclusionsConstants';

export interface ExclusionInterface {
    id: string,
    hostname: string,
    state: ExclusionStates,
}

export interface IndexedExclusionsInterface {
    [id: string]: string[];
}
