import { nanoid } from 'nanoid';

interface ExclusionServiceInterface {
    id: string;

    name: string;

    domains: string[];
}

class ExclusionService implements ExclusionServiceInterface {
    id: string;

    name: string;

    domains: string[];
}

interface ExclusionInterface {
    id: string;

    name: string;

    enabled: boolean;
}

class Exclusion implements ExclusionInterface {
    id: string;

    name: string;

    enabled: boolean;

    constructor(name: string) {
        this.id = nanoid();
        this.name = name;
        this.enabled = true;
    }
}

interface ServiceData {
    id: string,
    name: string,
    enabled: boolean, // TODO may be enabled/disabled/partially, when some of exclusions is enabled
    exclusions: string[],
}

interface ExclusionData {
    id: string,
    name: string,
    enabled: boolean,
}

// TODO find better name
interface ExclusionsData {
    services: ServiceData[],
    exclusions: ExclusionData[],
}

export class ExclusionsManager {
    exclusions: ExclusionInterface[] = [];

    exclusionsServices: ExclusionServiceInterface [] = [];

    setExclusions(exclusions: ExclusionInterface[]) {
        this.exclusions = exclusions;
    }

    setExclusionsServices(exclusionServices: ExclusionServiceInterface[]) {
        this.exclusionsServices = exclusionServices;
    }

    getExclusionsData() {
        const result: ExclusionsData = {
            services: [],
            exclusions: [],
        };

        this.exclusionsServices.forEach((service) => {
            this.exclusions.forEach((exclusion) => {
                const found = service.domains.some((domain) => domain === exclusion.name);
                if (found) {
                    result.services.push({
                        id: service.id,
                        name: service.name,
                        enabled: true, // TODO calculate dynamically
                        exclusions: [exclusion.id],
                    });
                    result.exclusions.push({
                        id: exclusion.id,
                        name: exclusion.name,
                        enabled: true,
                    });
                }
            });
        });

        return result;
    }

    addExclusion(url: string) {
        const exclusion = new Exclusion(url);

        // TODO do to not forget to check prev values
        this.exclusions.push(exclusion);
    }

    removeExclusion() {

    }
}
