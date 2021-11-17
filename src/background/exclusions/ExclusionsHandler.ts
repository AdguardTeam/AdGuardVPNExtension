import { ExclusionsGroup } from './ExclusionsGroup';
import { STATE } from '../../common/exclusionsConstants';
import { Exclusion } from './Exclusion';
import { Service } from './Service';
import { servicesManager } from './ServicesManager';
import { log } from '../../lib/logger';
import { getHostname, prepareUrl } from '../../lib/helpers';
import { areHostnamesEqual, shExpMatch } from '../../lib/string-utils';

const IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

interface ExclusionsData {
    excludedServices: Service[],
    exclusionsGroups: ExclusionsGroup[],
    excludedIps: Exclusion[];
}

interface ExclusionsManagerInterface {
    // methods for services
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
    // toggleServiceState

    // toggleExclusionsGroupStateInService
    // or replace with universal method for ExclusionsGroup and Service

    // toggleSubdomainStateInExclusionsGroupInService
    // or replace with universal method for ExclusionsGroup and Service

    // methods for groups
    addExclusionsGroup(hostname: string): void;
    removeExclusionsGroup(id: string): void;
    addSubdomainToExclusionsGroup(id: string, subdomain: string): void;
    removeSubdomainFromExclusionsGroup(exclusionsGroupId: string, subdomainId: string): void;
    toggleExclusionsGroupState(id: string): void;
    toggleSubdomainStateInExclusionsGroup(exclusionsGroupId: string, subdomainId: string): void;

    // methods for ips
    addIp(ip: string): void;
    removeIp(ip: string): void;
    toggleIpState(id: string): void;

    // common methods
    getExclusions(): ExclusionsData;
    addUrlToExclusions(url: string): void;
    isExcluded(url: string): boolean|undefined;
}

export class ExclusionsHandler implements ExclusionsData, ExclusionsManagerInterface {
    excludedServices: Service[];

    exclusionsGroups: ExclusionsGroup[];

    excludedIps: Exclusion[];

    mode: string;

    updateHandler: () => void;

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

    async addUrlToExclusions(hostname: string) {
        if (IP_REGEX.test(hostname)) {
            await this.addIp(hostname);
        } else {
            await this.addExclusionsGroup(hostname);
        }
    }

    async addService(serviceId: string) {
        if (this.excludedServices
            .some((excludedService: Service) => excludedService.serviceId === serviceId)) {
            // TODO enable service
            return;
        }
        const service = servicesManager.getService(serviceId);
        if (!service) {
            log.error(`Unable to add service. There is no service '${serviceId}'`);
            return;
        }
        this.excludedServices.push(service);
        await this.updateHandler();
    }

    async removeService(serviceId: string) {
        this.excludedServices = this.excludedServices
            .filter((excludedService: Service) => excludedService.serviceId !== serviceId);
        await this.updateHandler();
    }

    async addSubdomainToServiceExclusionsGroup(
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
        await this.updateHandler();
    }

    async removeSubdomainFromServiceExclusionsGroup(
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
        await this.updateHandler();
    }

    async addExclusionsGroup(dirtyUrl: string) {
        const url = prepareUrl(dirtyUrl);
        // save hostnames as ASCII because 'pacScript.url' supports only ASCII URLs
        // https://chromium.googlesource.com/chromium/src/+/3a46e0bf9308a42642689c4b73b6b8622aeecbe5/chrome/browser/extensions/api/proxy/proxy_api_helpers.cc#115
        const hostname = getHostname(url);
        if (!hostname) {
            return;
        }

        const serviceId = servicesManager.isService(hostname);
        if (serviceId) {
            await this.addService(serviceId);
            return;
        }

        if (this.exclusionsGroups
            .some((group: ExclusionsGroup) => group.hostname === hostname)) {
            this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
                if (group.hostname === hostname) {
                    group.exclusions.forEach((exclusion) => {
                        group.setSubdomainStateById(exclusion.id, true);
                    });
                }
            });
        } else {
            const newExclusionsGroup = new ExclusionsGroup(hostname);
            this.exclusionsGroups.push(newExclusionsGroup);
        }
        await this.updateHandler();
    }

    async removeExclusionsGroup(id: string) {
        this.exclusionsGroups = this.exclusionsGroups
            .filter((exclusionsGroup: ExclusionsGroup) => exclusionsGroup.id !== id);
        await this.updateHandler();
    }

    async addSubdomainToExclusionsGroup(id: string, subdomain: string) {
        this.exclusionsGroups.forEach((exclusionsGroup: ExclusionsGroup) => {
            if (exclusionsGroup.id === id) {
                exclusionsGroup.addSubdomain(subdomain);
            }
        });
        await this.updateHandler();
    }

    async removeSubdomainFromExclusionsGroup(exclusionsGroupId: string, subdomainId: string) {
        this.exclusionsGroups.forEach((exclusionsGroup: ExclusionsGroup) => {
            if (exclusionsGroup.id === exclusionsGroupId) {
                exclusionsGroup.removeSubdomain(subdomainId);
            }
        });
        await this.updateHandler();
    }

    async toggleExclusionsGroupState(exclusionsGroupId: string) {
        this.exclusionsGroups.forEach((exclusionsGroup: ExclusionsGroup) => {
            if (exclusionsGroup.id === exclusionsGroupId) {
                exclusionsGroup.toggleExclusionsGroupState();
            }
        });
        await this.updateHandler();
    }

    async toggleSubdomainStateInExclusionsGroup(exclusionsGroupId: string, subdomainId: string) {
        this.exclusionsGroups.forEach((exclusionsGroup: ExclusionsGroup) => {
            if (exclusionsGroup.id === exclusionsGroupId) {
                exclusionsGroup.toggleSubdomainState(subdomainId);
            }
        });
        await this.updateHandler();
    }

    async addIp(ip: string) {
        if (!this.excludedIps
            .some((excludedIp: Exclusion) => excludedIp.hostname === ip)) {
            const excludedIp = new Exclusion(ip);
            this.excludedIps.push(excludedIp);
        }
        await this.updateHandler();
    }

    async removeIp(ip: string) {
        this.excludedIps = this.excludedIps
            .filter((excludedIp: Exclusion) => excludedIp.hostname !== ip);
        await this.updateHandler();
    }

    async toggleIpState(id:string) {
        this.excludedIps.forEach((ip: Exclusion) => {
            if (ip.id === id) {
                // eslint-disable-next-line no-param-reassign
                ip.enabled = !ip.enabled;
            }
        });
        await this.updateHandler();
    }

    /**
     * Checks if there are enabled exclusions for provided url
     * @param url
     * @param includeWildcards
     * @return boolean
     */
    checkEnabledExclusionsByUrl = (url: string, includeWildcards = true) => {
        const hostname = getHostname(url);
        if (!hostname) {
            return undefined;
        }

        const enabledIpsByUrl = this.excludedIps
            .filter((exclusion) => {
                return (areHostnamesEqual(hostname, exclusion.hostname)
                    || (includeWildcards && shExpMatch(hostname, exclusion.hostname)))
                    && exclusion.enabled;
            });

        const enabledGroupsByUrl = this.exclusionsGroups.filter((group) => {
            return group.exclusions.some((exclusion) => {
                return (group.state === STATE.Enabled || group.state === STATE.PartlyEnabled)
                    && (areHostnamesEqual(hostname, exclusion.hostname)
                        || (includeWildcards && shExpMatch(hostname, exclusion.hostname)))
                    && exclusion.enabled;
            });
        });

        // const services = this.excludedServices.map((service) => {
        //     return service.exclusionsGroups.map((group) => {
        // eslint-disable-next-line max-len
        //         return group.exclusions.filter((exclusion) => areHostnamesEqual(hostname, exclusion.hostname)
        //             || (includeWildcards && shExpMatch(hostname, exclusion.hostname)));
        //     });
        // });

        return !!([...enabledIpsByUrl, ...enabledGroupsByUrl].length);
    };

    isExcluded = (url: string) => {
        if (!url) {
            return false;
        }
        return this.checkEnabledExclusionsByUrl(url);
    };

    async clearExclusionsData() {
        this.excludedServices = [];
        this.exclusionsGroups = [];
        this.excludedIps = [];
        await this.updateHandler();
    }
}
