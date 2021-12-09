import { Service, ServiceCategory } from './Service';
import { vpnProvider } from '../../providers/vpnProvider';

interface RawServiceCategory {
    id: string;
    name: string;
}

export interface RawService {
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

export interface IndexedServicesInterface {
    [id: string]: string
}

export interface ServiceDto {
    serviceId: string,
    serviceName: string,
    iconUrl: string,
    categories: ServiceCategory[],
}

export interface ServicesInterface {
    [serviceId: string]: Service,
}

export class ServicesManager {
    services: ServicesInterface = {};

    servicesIndex: IndexedServicesInterface = {};

    async init() {
        this.services = await this.updateServices();
        this.servicesIndex = this.getServicesIndex(this.services);
    }

    /**
     * Returns services data
     */
    getServices(): ServicesInterface {
        return this.services;
    }

    getIndexedServices() {
        return this.servicesIndex;
    }

    /**
     * Returns map with services index by domain
     * @param services
     */
    getServicesIndex(services: ServicesInterface): IndexedServicesInterface {
        return Object.values(services).reduce((acc: IndexedServicesInterface, service) => {
            service.domains.forEach((domain) => {
                acc[domain] = service.serviceId;
            });

            return acc;
        }, {});
    }

    /**
     * Returns services data for list
     */
    getServicesDto(): ServiceDto[] {
        return Object.values(this.services).map((service) => {
            return {
                serviceId: service.serviceId,
                serviceName: service.serviceName,
                iconUrl: service.iconUrl,
                categories: service.categories,
            };
        });
    }

    // FIXME
    //  - fetch services from backend
    //  - handle persistence
    //  - or from storage
    async updateServices() {
        const services:Service[] = [];
        const rawExclusionServices = await vpnProvider.getExclusionsServices();
        const {
            services: rawServices,
            categories: rawCategories,
        } = rawExclusionServices as RawExclusionServices;

        const servicesDomains = await vpnProvider.getExclusionsServicesDomains([]);

        Object.values(rawServices).forEach((rawService: RawService) => {
            const categories = rawService.categories.map((categoryId) => {
                const category = rawCategories[categoryId];
                return category;
            });

            const { domains } = servicesDomains[rawService.serviceId];
            const service = new Service({ ...rawService, categories, domains });

            services.push(service);
        });

        return services.reduce((acc: ServicesInterface, service) => {
            acc[service.serviceId] = service;
            return acc;
        }, {});
    }
}

export const servicesManager = new ServicesManager();
