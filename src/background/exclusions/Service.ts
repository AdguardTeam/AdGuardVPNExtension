import { ExclusionsGroup } from './ExclusionsGroup.ts';

// TODO
//  - fetch services from backend
//  - handle persistence
//  - or from storage

interface ServiceBackendInterface {
    service_id: string;
    service_name: string;
    icon_url: string;
    categories: string[];
    modified_time: string;
}

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

    constructor(service: ServiceBackendInterface) {
        this.serviceId = service.service_id;
        this.serviceName = service.service_name;
        this.iconUrl = service.icon_url;
        this.categories = service.categories;
        this.modifiedTime = service.modified_time;
        this.exclusionsGroups = [];
    }
}
