import { ServiceCategory, ServiceInterface } from '../../../common/exclusionsConstants';

export class Service implements ServiceInterface {
    serviceId: string;

    serviceName: string;

    iconUrl: string;

    modifiedTime: string;

    categories: ServiceCategory[];

    domains: string[];

    constructor(service: ServiceInterface) {
        this.serviceId = service.serviceId;
        this.serviceName = service.serviceName;
        this.iconUrl = service.iconUrl;
        this.categories = service.categories;
        this.modifiedTime = service.modifiedTime;
        this.domains = service.domains;
    }
}
