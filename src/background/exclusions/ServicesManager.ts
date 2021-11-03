import { Service, ServiceInterface } from './Service';
import vpnProvider from '../providers/vpnProvider';

class ServicesManager {
    services: Service[];

    constructor() {
        this.services = [];
    }

    // TODO
    //  - fetch services from backend
    //  - handle persistence
    //  - or from storage

    async updateServices() {
        this.services = [];
        const servicesData = await vpnProvider.getExclusionsServices();
        const servicesDomains = await vpnProvider.getExclusionsServicesDomains([]);

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
