import { ExclusionsGroup } from './ExclusionsGroup';
import { ExclusionStates } from '../../common/exclusionsConstants';

export interface ServiceCategory {
    id: string,
    name: string,
}

export interface ServiceInterface {
    serviceId: string;
    serviceName: string;
    iconUrl: string;
    categories: ServiceCategory[];
    modifiedTime: string;
    exclusionsGroups?: ExclusionsGroup[];
    state?: ExclusionStates;
    domains?: string[];
}

export class Service implements ServiceInterface {
    serviceId: string;

    serviceName: string;

    iconUrl: string;

    categories: ServiceCategory[];

    modifiedTime: string;

    exclusionsGroups: ExclusionsGroup[];

    state: ExclusionStates;

    constructor(service: ServiceInterface) {
        this.serviceId = service.serviceId;
        this.serviceName = service.serviceName;
        this.iconUrl = service.iconUrl;
        this.categories = service.categories;
        this.modifiedTime = service.modifiedTime;
        this.exclusionsGroups = service.exclusionsGroups
            ?.map((group) => new ExclusionsGroup(group)) || [];
        this.state = service.state || ExclusionStates.Enabled;

        const { domains } = service;

        if (domains) {
            domains.forEach((domain: string) => {
                this.addExclusionsGroup(domain);
            });
        }
    }

    /**
     * Adds new ExclusionsGroup
     */
    addExclusionsGroup(hostname: string) {
        if (this.exclusionsGroups.some((group) => group.hostname === hostname)) {
            this.exclusionsGroups.forEach((group) => {
                if (group.hostname === hostname) {
                    group.enableExclusionsGroup();
                }
            });
            this.updateServiceState();
            return;
        }

        const exclusionsGroups = new ExclusionsGroup(hostname);
        this.exclusionsGroups.push(exclusionsGroups);
        this.updateServiceState();
    }

    /**
     * Removes ExclusionsGroup by id
     */
    removeExclusionsGroup(id: string) {
        this.exclusionsGroups = this.exclusionsGroups.filter((group) => group.id !== id);
        this.updateServiceState();
    }

    /**
     * Toggles ExclusionsGroup state
     * @param id
     */
    toggleExclusionsGroupState = (id: string) => {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            if (group.id === id) {
                group.toggleExclusionsGroupState();
            }
        });
        this.updateServiceState();
    };

    /**
     * Removes subdomain from ExclusionsGroups
     * @param exclusionsGroupId
     * @param domainId
     */
    removeDomainFromExclusionsGroup = (exclusionsGroupId: string, domainId: string) => {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            if (group.id === exclusionsGroupId) {
                if (group.exclusions[0].id === domainId) {
                    this.removeExclusionsGroup(exclusionsGroupId);
                }
                group.removeSubdomain(domainId);
            }
        });
        this.updateServiceState();
    };

    /**
     * Adds subdomain to ExclusionsGroups
     * @param exclusionsGroupId
     * @param subdomain
     */
    addSubdomainToExclusionsGroup = (exclusionsGroupId: string, subdomain: string) => {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            if (group.id === exclusionsGroupId) {
                group.addSubdomain(subdomain);
            }
        });
        this.updateServiceState();
    };

    /**
     * Toggles domain state in ExclusionsGroups
     * @param exclusionsGroupId
     * @param domainId
     */
    toggleDomainStateInExclusionsGroup = (exclusionsGroupId: string, domainId: string) => {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            if (group.id === exclusionsGroupId) {
                group.toggleSubdomainState(domainId);
            }
        });
        this.updateServiceState();
    };

    /**
     * Enables domain in ExclusionsGroups
     * @param exclusionsGroupId
     * @param hostname
     */
    enableDomainInExclusionsGroupByHostname = (exclusionsGroupId: string, hostname: string) => {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            if (group.id === exclusionsGroupId) {
                group.setSubdomainStateByUrl(hostname, ExclusionStates.Enabled);
            }
        });
        this.updateServiceState();
    };

    /**
     * Enables all ExclusionsGroups
     */
    enableExclusionsGroups() {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            group.enableExclusionsGroup();
        });
    }

    /**
     * Disables all ExclusionsGroups
     */
    disableExclusionsGroups() {
        this.exclusionsGroups.forEach((group: ExclusionsGroup) => {
            group.disableExclusionsGroup();
        });
    }

    enableService = () => {
        this.state = ExclusionStates.Enabled;
        this.enableExclusionsGroups();
    };

    disableService = () => {
        this.state = ExclusionStates.Disabled;
        this.disableExclusionsGroups();
    };

    toggleServiceState = () => {
        if (this.state === ExclusionStates.Enabled
            || this.state === ExclusionStates.PartlyEnabled) {
            this.disableService();
        } else {
            this.enableService();
        }
    };

    /**
     * Sets Service state according to the states of ExclusionsGroups
     */
    updateServiceState() {
        const enabledGroups = this.exclusionsGroups
            .filter((exclusion: ExclusionsGroup) => exclusion.state === ExclusionStates.Enabled);

        const disabledGroups = this.exclusionsGroups
            .filter((exclusion: ExclusionsGroup) => exclusion.state === ExclusionStates.Disabled);

        if (enabledGroups.length === this.exclusionsGroups.length) {
            this.state = ExclusionStates.Enabled;
        } else if (disabledGroups.length === this.exclusionsGroups.length) {
            this.state = ExclusionStates.Disabled;
        } else {
            this.state = ExclusionStates.PartlyEnabled;
        }
    }
}
