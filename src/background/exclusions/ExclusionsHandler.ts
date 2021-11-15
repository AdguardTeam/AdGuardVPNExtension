import { ExclusionsGroup } from './ExclusionsGroup';
import { Exclusion } from './Exclusion';
import { Service } from './Service';
import { servicesManager } from './ServicesManager';
import { log } from '../../lib/logger';
// import { getHostname } from '../../lib/helpers';
// import { areHostnamesEqual, shExpMatch } from '../../lib/string-utils';

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

export class ExclusionsHandler implements ExclusionsData, ExclusionsManagerInterface {
    excludedServices: Service[];

    exclusionsGroups: ExclusionsGroup[];

    excludedIps: Exclusion[];

    mode: string;

    updateHandler: any;

    constructor(updateHandler: () => void, exclusions: ExclusionsData, mode: string) {
        this.updateHandler = updateHandler;
        this.excludedServices = exclusions.excludedServices || [];
        this.exclusionsGroups = exclusions.exclusionsGroups || [];
        this.excludedIps = exclusions.excludedIps || [];
        this.mode = mode;
    }

    get exclusionsData() {
        return {
            excludedServices: this.excludedServices,
            exclusionsGroups: this.exclusionsGroups,
            excludedIps: this.excludedIps,
        };
    }

    getExclusions() {
        return this.exclusionsData;
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
        this.updateHandler();
    }

    removeService(serviceId: string) {
        this.excludedServices = this.excludedServices
            .filter((excludedService: Service) => excludedService.serviceId !== serviceId);
        this.updateHandler();
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
        this.updateHandler();
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
        this.updateHandler();
    }

    addExclusionsGroup(hostname: string) {
        // TODO: check services list for provided hostname
        if (!this.exclusionsGroups
            .some((exclusionsGroup: ExclusionsGroup) => exclusionsGroup.hostname === hostname)) {
            const exclusionsGroup = new ExclusionsGroup(hostname);
            this.exclusionsGroups.push(exclusionsGroup);
        }
        this.updateHandler();
    }

    removeExclusionsGroup(hostname: string) {
        this.exclusionsGroups = this.exclusionsGroups
            .filter((exclusionsGroup: ExclusionsGroup) => exclusionsGroup.hostname !== hostname);
        this.updateHandler();
    }

    addSubdomainToExclusionsGroup(id: string, subdomain: string) {
        this.exclusionsGroups.forEach((exclusionsGroup: ExclusionsGroup) => {
            if (exclusionsGroup.id === id) {
                exclusionsGroup.addSubdomain(subdomain);
            }
        });
        this.updateHandler();
    }

    removeSubdomainFromExclusionsGroup(exclusionsGroupId: string, subdomainId: string) {
        this.exclusionsGroups.forEach((exclusionsGroup: ExclusionsGroup) => {
            if (exclusionsGroup.id === exclusionsGroupId) {
                exclusionsGroup.removeSubdomain(subdomainId);
            }
        });
        this.updateHandler();
    }

    addIp(ip: string) {
        if (!this.excludedIps
            .some((excludedIp: Exclusion) => excludedIp.hostname === ip)) {
            const excludedIp = new Exclusion(ip);
            this.excludedIps.push(excludedIp);
        }
        this.updateHandler();
    }

    removeIp(ip: string) {
        this.excludedIps = this.excludedIps
            .filter((excludedIp: Exclusion) => excludedIp.hostname !== ip);
        this.updateHandler();
    }

    toggleIpState(id:string) {
        this.excludedIps.forEach((ip: Exclusion) => {
            if (ip.id === id) {
                // eslint-disable-next-line no-param-reassign
                ip.enabled = !ip.enabled;
            }
        });
        this.updateHandler();
    }

    /**
     * Returns exclusion by url
     * @param url
     * @param includeWildcards
     */
    getExclusionsByUrl = (url: string, includeWildcards = true) => {
        // const hostname = getHostname(url);
        // if (!hostname) {
        //     return undefined;
        // }
        // debugger;
        // const ips = this.excludedIps
        //     .filter((exclusion) => areHostnamesEqual(hostname, exclusion.hostname)
        //         || (includeWildcards && shExpMatch(hostname, exclusion.hostname)));
        //
        // const groups = this.exclusionsGroups.map((group) => {
        //     return group.exclusions.filter((exclusion) => areHostnamesEqual(hostname, exclusion.hostname)
        //         || (includeWildcards && shExpMatch(hostname, exclusion.hostname)));
        // });
        //
        // const services = this.excludedServices.map((service) => {
        //     return service.exclusionsGroups.map((group) => {
        //         return group.exclusions.filter((exclusion) => areHostnamesEqual(hostname, exclusion.hostname)
        //             || (includeWildcards && shExpMatch(hostname, exclusion.hostname)));
        //     });
        // });
        //
        // const result = [...ips, ...groups, ...services].flat();
        //
        return [];
    };

    isExcluded = (url: string) => {
        if (!url) {
            return false;
        }

        const exclusions = this.getExclusionsByUrl(url);
        return exclusions.some((exclusion) => exclusion.enabled);
    };

    clearExclusionsData() {
        this.excludedServices = [];
        this.exclusionsGroups = [];
        this.excludedIps = [];
    }
}
