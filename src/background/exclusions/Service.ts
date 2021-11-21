import { ExclusionsGroup } from './ExclusionsGroup';
import { STATE } from '../../common/exclusionsConstants';

export interface ServiceInterface {
    serviceId: string;
    serviceName: string;
    iconUrl: string;
    categories: string[];
    modifiedTime: string;
    exclusionsGroups: ExclusionsGroup[];
    state: STATE;
}

export class Service implements ServiceInterface {
    serviceId: string;

    serviceName: string;

    iconUrl: string;

    categories: string[];

    modifiedTime: string;

    exclusionsGroups: ExclusionsGroup[];

    state: STATE;

    constructor(service: ServiceInterface) {
        this.serviceId = service.serviceId;
        this.serviceName = service.serviceName;
        this.iconUrl = service.iconUrl;
        this.categories = service.categories;
        this.modifiedTime = service.modifiedTime;
        this.exclusionsGroups = service.exclusionsGroups
            ?.map((group) => new ExclusionsGroup(group)) || [];
        this.state = service.state || STATE.Enabled;
    }

    addExclusionsGroup(hostname: string) {
        const exclusionsGroups = new ExclusionsGroup(hostname);
        this.exclusionsGroups.push(exclusionsGroups);
    }

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

    enableService() {
        this.state = STATE.Enabled;
        this.enableExclusionsGroups();
    }

    disableService() {
        this.state = STATE.Disabled;
        this.disableExclusionsGroups();
    }

    toggleServiceState = () => {
        if (this.state === STATE.Enabled || this.state === STATE.PartlyEnabled) {
            this.disableService();
        } else {
            this.enableService();
        }
    }
}
