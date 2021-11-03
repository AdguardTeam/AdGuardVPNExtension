import { ExclusionsGroup } from './ExclusionsGroup';
import { Service } from './Service';
import { servicesManager } from './ServicesManager';
import { log } from '../../lib/logger';

interface ExclusionsData {
    excludedServices: Service[],
    exclusionsGroups: ExclusionsGroup[],
}

class ExclusionsManager implements ExclusionsData {
    excludedServices: Service[];

    exclusionsGroups: ExclusionsGroup[];

    constructor() {
        this.excludedServices = [];
        this.exclusionsGroups = [];
    }

    addService(serviceId: string) {
        if (!this.excludedServices
            .some((excludedService) => excludedService.serviceId === serviceId)) {
            const service = servicesManager.getService(serviceId);
            if (!service) {
                log.error(`Unable to add service. There is no service '${serviceId}'`);
                return;
            }
            this.excludedServices.push(service);
        }
    }

    removeService(serviceId: string) {
        this.excludedServices = this.excludedServices
            .filter((excludedService) => excludedService.serviceId !== serviceId);
    }

    addExclusionsGroup(hostname: string) {
        if (!this.exclusionsGroups
            .some((exclusionsGroup) => exclusionsGroup.hostname === hostname)) {
            const exclusionsGroup = new ExclusionsGroup(hostname);
            this.exclusionsGroups.push(exclusionsGroup);
        }
    }

    removeExclusionsGroup(hostname: string) {
        this.exclusionsGroups = this.exclusionsGroups
            .filter((exclusionsGroup) => exclusionsGroup.hostname !== hostname);
    }

    getExclusionsData() {
        return {
            services: this.excludedServices,
            exclusions: this.exclusionsGroups,
        };
    }

    async init() {
        await servicesManager.init();
    }
}

export const exclusionsManager = new ExclusionsManager();
