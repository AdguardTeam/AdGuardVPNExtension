import { ExclusionsGroup } from './ExclusionsGroup';
import { Exclusion } from './Exclusion';
import { Service } from './Service';
import { servicesManager } from './ServicesManager';
import { log } from '../../lib/logger';

interface ExclusionsData {
    excludedServices: Service[],
    exclusionsGroups: ExclusionsGroup[],
    excludedIps: Exclusion[];
}

interface ExclusionsManagerInterface {
    excludedServices: Service[],
    exclusionsGroups: ExclusionsGroup[],
    excludedIps: Exclusion[];

    addService(serviceId: string): void;
    removeService(serviceId: string): void;
    // addSubdomainToServiceExclusionsGroup(serviceId: string, id: string, subdomain: string): void;
    // removeSubdomainFromServiceExclusionsGroup(serviceId: string, id: string, subdomain: string);
    // switch service state
    // switch service ExclusionsGroup state
    // switch service ExclusionsGroup exclusion state

    addExclusionsGroup(hostname: string): void;
    removeExclusionsGroup(hostname: string): void;
    // addSubdomainToExclusionsGroup(id: string, subdomain: string): void;
    // removeSubdomainFromExclusionsGroup(id: string, subdomain: string): void;
    // switch ExclusionsGroup state
    // switch ExclusionsGroup exclusion state

    addIp(ip: string): void;
    removeIp(ip: string): void;
    toggleIpState(id: string): void;
}

class ExclusionsManager implements ExclusionsData, ExclusionsManagerInterface {
    excludedServices: Service[];

    exclusionsGroups: ExclusionsGroup[];

    excludedIps: Exclusion[];

    constructor() {
        this.excludedServices = [];
        this.exclusionsGroups = [];
        this.excludedIps = [];
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

    addIp(ip: string) {
        if (!this.excludedIps
            .some((excludedIp) => excludedIp.hostname === ip)) {
            const excludedIp = new Exclusion(ip);
            this.excludedIps.push(excludedIp);
        }
    }

    removeIp(ip: string) {
        this.excludedIps = this.excludedIps
            .filter((excludedIp) => excludedIp.hostname !== ip);
    }

    toggleIpState(id:string) {
        this.excludedIps.forEach((ip) => {
            if (ip.id === id) {
                // eslint-disable-next-line no-param-reassign
                ip.enabled = !ip.enabled;
            }
        });
    }

    getExclusionsData() {
        return {
            services: this.excludedServices,
            exclusions: this.exclusionsGroups,
            ips: this.excludedIps,
        };
    }

    async init() {
        await servicesManager.init();
    }
}

export const exclusionsManager = new ExclusionsManager();
