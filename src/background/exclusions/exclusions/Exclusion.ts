import { nanoid } from 'nanoid';

import { ExclusionStates } from '../../../common/exclusionsConstants';

interface ExclusionInterface {
    id: string;
    hostname: string;
    enabled: ExclusionStates;
}

export class Exclusion implements ExclusionInterface {
    id: string;

    hostname: string;

    enabled: ExclusionStates;

    constructor(exclusionData: ExclusionInterface | string) {
        if (typeof exclusionData === 'string') {
            this.id = nanoid();
            this.hostname = exclusionData;
            this.enabled = ExclusionStates.Enabled;
        } else {
            this.id = exclusionData.id;
            this.hostname = exclusionData.hostname;
            this.enabled = exclusionData.enabled;
        }
    }
}
