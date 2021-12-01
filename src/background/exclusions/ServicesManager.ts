import { Service } from './Service';
import vpnProvider from '../providers/vpnProvider';
import { prepareUrl } from '../../lib/helpers';

interface RawServiceCategory {
    id: string;
    name: string;
}

interface RawService {
    serviceId: string,
    serviceName: string,
    iconUrl: string,
    categories: string[],
    modifiedTime: string,
}

interface RawExclusionServices {
    services: { [index: string]: RawService };
    categories: { [index: string]: RawServiceCategory };
}

interface RawServiceDomain {
    serviceId: string,
    domains: string[],
}

interface RawServicesDomainsMap {
    [index: string]: RawServiceDomain;
}

class ServicesManager {
    services: Service[];

    servicesDomains: RawServicesDomainsMap;

    categories: { [index: string]: RawServiceCategory };

    constructor() {
        this.categories = {};
        this.services = [];
        this.servicesDomains = {};
    }

    // FIXME
    //  - fetch services from backend
    //  - handle persistence
    //  - or from storage
    async updateServices() {
        this.services = [];
        const rawExclusionServices = await vpnProvider.getExclusionsServices();
        const { services, categories } = rawExclusionServices as RawExclusionServices;

        this.categories = categories;

        const servicesDomains = await vpnProvider.getExclusionsServicesDomains([]);
        this.servicesDomains = servicesDomains;

        Object.values(services).forEach((rawService: RawService) => {
            const categories = rawService.categories.map((categoryId) => {
                const category = this.categories[categoryId];
                return category;
            });

            const { domains } = servicesDomains[rawService.serviceId];
            const service = new Service({ ...rawService, categories, domains });

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
    getServiceIdByUrl(url: string): string | null {
        const hostname = prepareUrl(url);
        if (!hostname) {
            return null;
        }

        const service = Object.values(this.servicesDomains).find((service) => {
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
