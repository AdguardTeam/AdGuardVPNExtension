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

    constructor(hostname: string) {
        this.id = nanoid();
        this.hostname = hostname;
        this.enabled = true;
    }
}
