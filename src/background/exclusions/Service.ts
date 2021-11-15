import { ExclusionsGroup } from './ExclusionsGroup';

export interface ServiceInterface {
    serviceId: string;
    serviceName: string;
    iconUrl: string;
    categories: string[];
    modifiedTime: string;
    exclusionsGroups: ExclusionsGroup[];
}

export class Service implements ServiceInterface {
    serviceId: string;

    serviceName: string;

    iconUrl: string;

    categories: string[];

    modifiedTime: string;

    exclusionsGroups: ExclusionsGroup[];

    // TODO: add state

    constructor(service: ServiceInterface) {
        this.serviceId = service.serviceId;
        this.serviceName = service.serviceName;
        this.iconUrl = service.iconUrl;
        this.categories = service.categories;
        this.modifiedTime = service.modifiedTime;
        this.exclusionsGroups = [];
    }

    addExclusionsGroup(hostname: string) {
        const exclusionsGroups = new ExclusionsGroup(hostname);
        this.exclusionsGroups.push(exclusionsGroups);
    }
}
