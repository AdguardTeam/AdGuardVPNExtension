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
    addService(serviceId: string): void;
    removeService(serviceId: string): void;
    addSubdomainToServiceExclusionsGroup(
        serviceId: string,
        exclusionsGroupId: string,
        subdomain: string,
    ): void;
    removeSubdomainFromServiceExclusionsGroup(
        serviceId: string,
        exclusionsGroupId: string,
        subdomainId: string,
    ): void;
    // toggle service state
    // toggle service ExclusionsGroup state
    // toggle service ExclusionsGroup exclusion state

    addExclusionsGroup(hostname: string): void;
    removeExclusionsGroup(hostname: string): void;
    addSubdomainToExclusionsGroup(id: string, subdomain: string): void;
    removeSubdomainFromExclusionsGroup(id: string, subdomain: string): void;
    // toggle ExclusionsGroup state
    // toggle ExclusionsGroup exclusion state

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
        if (this.excludedServices
            .some((excludedService: Service) => excludedService.serviceId === serviceId)) {
            return;
        }
        const service = servicesManager.getService(serviceId);
        if (!service) {
            log.error(`Unable to add service. There is no service '${serviceId}'`);
            return;
        }
        this.excludedServices.push(service);
    }

    removeService(serviceId: string) {
        this.excludedServices = this.excludedServices
            .filter((excludedService: Service) => excludedService.serviceId !== serviceId);
    }

    addSubdomainToServiceExclusionsGroup(
        serviceId: string,
        exclusionsGroupId: string,
        subdomain: string,
    ) {
        this.excludedServices.forEach((service: Service) => {
            if (service.serviceId === serviceId) {
                service.exclusionsGroups.forEach((exclusionsGroup) => {
                    if (exclusionsGroup.id === exclusionsGroupId) {
                        exclusionsGroup.addSubdomain(subdomain);
                    }
                });
            }
        });
    }

    removeSubdomainFromServiceExclusionsGroup(
        serviceId: string,
        exclusionsGroupId: string,
        subdomainId: string,
    ) {
        this.excludedServices.forEach((service: Service) => {
            if (service.serviceId === serviceId) {
                service.exclusionsGroups.forEach((exclusionsGroup) => {
                    if (exclusionsGroup.id === exclusionsGroupId) {
                        exclusionsGroup.removeSubdomain(subdomainId);
                    }
                });
            }
        });
    }

    addExclusionsGroup(hostname: string) {
        // TODO: check services list for provided hostname
        if (!this.exclusionsGroups
            .some((exclusionsGroup: ExclusionsGroup) => exclusionsGroup.hostname === hostname)) {
            const exclusionsGroup = new ExclusionsGroup(hostname);
            this.exclusionsGroups.push(exclusionsGroup);
        }
    }

    removeExclusionsGroup(hostname: string) {
        this.exclusionsGroups = this.exclusionsGroups
            .filter((exclusionsGroup: ExclusionsGroup) => exclusionsGroup.hostname !== hostname);
    }

    addSubdomainToExclusionsGroup(id: string, subdomain: string) {
        this.exclusionsGroups.forEach((exclusionsGroup: ExclusionsGroup) => {
            if (exclusionsGroup.id === id) {
                exclusionsGroup.addSubdomain(subdomain);
            }
        });
    }

    removeSubdomainFromExclusionsGroup(exclusionsGroupId: string, subdomainId: string) {
        this.exclusionsGroups.forEach((exclusionsGroup: ExclusionsGroup) => {
            if (exclusionsGroup.id === exclusionsGroupId) {
                exclusionsGroup.removeSubdomain(subdomainId);
            }
        });
    }

    addIp(ip: string) {
        if (!this.excludedIps
            .some((excludedIp: Exclusion) => excludedIp.hostname === ip)) {
            const excludedIp = new Exclusion(ip);
            this.excludedIps.push(excludedIp);
        }
    }

    removeIp(ip: string) {
        this.excludedIps = this.excludedIps
            .filter((excludedIp: Exclusion) => excludedIp.hostname !== ip);
    }

    toggleIpState(id:string) {
        this.excludedIps.forEach((ip: Exclusion) => {
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

    clearExclusionsData() {
        this.excludedServices = [];
        this.exclusionsGroups = [];
        this.excludedIps = [];
    }

    async init() {
        await servicesManager.init();
    }
}

export const exclusionsManager = new ExclusionsManager();
