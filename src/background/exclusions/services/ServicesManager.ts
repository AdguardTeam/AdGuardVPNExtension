import { Service, ServiceCategory } from './Service';
import { vpnProvider } from '../../providers/vpnProvider';
import { ExclusionStates } from '../../../common/exclusionsConstants';
import browserApi from '../../browserApi';
import { log } from '../../../lib/logger';

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
    state?: ExclusionStates,
    categories: ServiceCategory[],
    domains: string[],
}

export interface ServicesInterface {
    [serviceId: string]: Service,
}

interface ServiceManagerInterface {
    init: () => Promise<void>;
    getServices: () => ServicesInterface;
}

export class ServicesManager implements ServiceManagerInterface {
    private services: ServicesInterface | null = null;

    private servicesIndex: IndexedServicesInterface | null = null;

    private lastUpdateTimeMs: number | null = null;

    // Update once in 24 hours
    private UPDATE_TIMEOUT_MS = 1000 * 60 * 60 * 24;

    // Key constant for storage
    private EXCLUSION_SERVICES_STORAGE_KEY = 'exclusions_services';

    public init = async () => {
        await this.updateServices();

        if (!this.services) {
            const services = await this.getServicesFromStorage();
            if (services) {
                this.setServices(services);
            }
        }
    };

    /**
     * Returns services data
     */
    getServices() {
        this.updateServices();
        return this.services ?? {};
    }

    getService(id: string): Service | null {
        if (!this.services) {
            return null;
        }

        const service = this.services[id];

        if (!service) {
            return null;
        }

        return service;
    }

    getIndexedServices() {
        return this.servicesIndex ?? {};
    }

    /**
     * Returns map with services index by domain
     * @param services
     */
    public static getServicesIndex(services: ServicesInterface): IndexedServicesInterface {
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
        this.updateServices();

        if (!this.services) {
            return [];
        }

        return Object.values(this.services).map((service) => {
            return {
                serviceId: service.serviceId,
                serviceName: service.serviceName,
                iconUrl: service.iconUrl,
                categories: service.categories,
                domains: service.domains,
            };
        });
    }

    setServices(services: ServicesInterface) {
        this.services = services;
        this.servicesIndex = ServicesManager.getServicesIndex(services);
    }

    async updateServices() {
        const shouldUpdate = this.lastUpdateTimeMs === null
            || (Date.now() - this.lastUpdateTimeMs) > this.UPDATE_TIMEOUT_MS;

        if (!shouldUpdate) {
            return;
        }

        try {
            const services = await this.getServicesFromServer();
            await this.saveServicesInStorage(services);
            this.setServices(services);
            this.lastUpdateTimeMs = Date.now();
            log.info('Services data updated successfully');
        } catch (e: any) {
            log.error(new Error(`Was unable to get services due to: ${e.message}`));
            setTimeout(() => {
                log.warn('Trying to get services');
                this.updateServices();
            }, 5000);
        }
    }

    /**
     * Gets exclusions services from server
     */
    async getServicesFromServer() {
        const services = await vpnProvider.getExclusionsServices() as ServicesInterface;

        return services;
    }

    async saveServicesInStorage(services: ServicesInterface): Promise<void> {
        await browserApi.storage.set(this.EXCLUSION_SERVICES_STORAGE_KEY, services);
    }

    async getServicesFromStorage(): Promise<ServicesInterface> {
        const services = await browserApi.storage.get(
            this.EXCLUSION_SERVICES_STORAGE_KEY,
        ) as ServicesInterface;

        return services ?? null;
    }
}

export const servicesManager = new ServicesManager();
