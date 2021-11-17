import { Service, ServiceInterface } from './Service';
import vpnProvider from '../providers/vpnProvider';
import { prepareUrl } from '../../lib/helpers';

class ServicesManager {
    services: Service[];

    servicesDomains: any[];

    constructor() {
        this.services = [];
        this.servicesDomains = [];
    }

    // TODO
    //  - fetch services from backend
    //  - handle persistence
    //  - or from storage

    async updateServices() {
        this.services = [];
        const servicesData = await vpnProvider.getExclusionsServices();
        const servicesDomains = await vpnProvider.getExclusionsServicesDomains([]);
        this.servicesDomains = servicesDomains;

        servicesData.forEach((serviceData: ServiceInterface) => {
            const service = new Service(serviceData);
            const { domains } = servicesDomains
                .find((serviceDomains: any) => serviceDomains.serviceId === service.serviceId);

            if (!domains || !domains.length) {
                return;
            }

            domains.forEach((domain: string) => {
                service.addExclusionsGroup(domain);
            });

            this.services.push(service);
        });
    }

    /**
     * Returns service by id
     */
    getService(serviceId: string) {
        return this.services.find((service) => service.serviceId === serviceId);
    }

    /**
     * Checks if provided hostname is service and returns serviceId or null
     */
    isService(url: string): string|null {
        const hostname = prepareUrl(url);
        const service = this.servicesDomains.find((service) => {
            return service.domains.includes(hostname);
        });

        return service ? service.serviceId : null;
    }

    /**
     * Returns all services data
     */
    getServicesData() {
        return this.services;
    }

    async init() {
        await this.updateServices();
    }
}

export const servicesManager = new ServicesManager();
