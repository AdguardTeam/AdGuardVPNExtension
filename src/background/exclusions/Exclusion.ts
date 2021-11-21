import { nanoid } from 'nanoid';

interface ExclusionInterface {
    id: string;
    hostname: string;
    enabled: boolean;
}

export class Exclusion implements ExclusionInterface {
    id: string;

    hostname: string;

    enabled: boolean;

    constructor(exclusionData: ExclusionInterface | string) {
        if (typeof exclusionData === 'string') {
            this.id = nanoid();
            this.hostname = exclusionData;
            this.enabled = true;
        } else {
            this.id = exclusionData.id;
            this.hostname = exclusionData.hostname;
            this.enabled = exclusionData.enabled;
        }
    }
}
