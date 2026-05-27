import type { ServiceCategory, ServiceInterface } from '../../schema';

export class Service implements ServiceInterface {
    public serviceId: string;

    public serviceName: string;

    public iconUrl: string;

    public modifiedTime: string;

    public categories: ServiceCategory[];

    public domains: string[];

    constructor(service: ServiceInterface) {
        this.serviceId = service.serviceId;
        this.serviceName = service.serviceName;
        this.iconUrl = service.iconUrl;
        this.categories = service.categories;
        this.modifiedTime = service.modifiedTime;
        this.domains = service.domains;
    }
}
