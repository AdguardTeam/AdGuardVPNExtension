/**
 * This module used in the tasks for resources build and in the code
 */

interface RawServicesDomains {
    service_id: string;
    domains: string[];
}

interface RawExclusionServicesDomains {
    services: RawServicesDomains[]
}

interface ServicesDomains {
    serviceId: string;
    domains: string[];
}

interface ExclusionServicesDomains {
    [key: string]: ServicesDomains;
}

interface RawExclusionCategory {
    id: string;
    name: string;
}

interface RawExclusionService {
    service_id: string;
    service_name: string;
    icon_url: string;
    categories: string[];
    modified_time: string;
}

interface RawExclusionServicesData {
    categories: RawExclusionCategory[]
    services: RawExclusionService[]
}

interface ExclusionCategory {
    id: string;
    name: string;
}

interface ExclusionCategories {
    [key: string]: ExclusionCategory;
}

interface ExclusionServicePreprocessed {
    serviceId: string;
    serviceName: string;
    iconUrl: string;
    categories: string[];
    modifiedTime: string;
}

interface ExclusionService extends Omit<ExclusionServicePreprocessed, 'categories'> {
    categories: ExclusionCategory[];
    domains: string[];
}

interface ExclusionServicesExceptDomains {
    [key: string]: ExclusionServicePreprocessed;
}

export interface ExclusionServices {
    [key: string]: ExclusionService;
}

/**
 * Transforms raw exclusion service domains to the map
 * @param exclusionServiceDomains
 */
export const processExclusionServicesDomains = (
    exclusionServiceDomains: RawExclusionServicesDomains,
): ExclusionServicesDomains => {
    return exclusionServiceDomains.services
        .map((service) => {
            const {
                service_id: serviceId,
                domains,
            } = service;

            return {
                serviceId,
                domains,
            };
        })
        .reduce((acc: ExclusionServicesDomains, service) => {
            acc[service.serviceId] = service;
            return acc;
        }, {});
};

/**
 * Transforms services to the map adding categories and domains
 * @param exclusionServices
 * @param servicesDomains
 */
export const processExclusionServices = (
    exclusionServices: RawExclusionServicesData,
    servicesDomains: ExclusionServicesDomains,
) => {
    const { categories = [], services = [] } = exclusionServices;

    const processedCategories = categories.reduce((acc: ExclusionCategories, category) => {
        acc[category.id] = category;
        return acc;
    }, {});

    const processedServices = services
        .map((exclusionService) => {
            const {
                service_id: serviceId,
                service_name: serviceName,
                icon_url: iconUrl,
                categories,
                modified_time: modifiedTime,
            } = exclusionService;

            return {
                serviceId,
                serviceName,
                iconUrl,
                categories,
                modifiedTime,
            };
        })
        .reduce((acc: ExclusionServicesExceptDomains, service) => {
            acc[service.serviceId] = service;
            return acc;
        }, {});

    const servicesResult: ExclusionServices = {};

    Object.values(processedServices).forEach((rawService) => {
        const categories = rawService.categories.map((categoryId) => {
            const category = processedCategories[categoryId];
            return category;
        });

        const { domains } = servicesDomains[rawService.serviceId];
        const service = { ...rawService, categories, domains };

        servicesResult[service.serviceId] = service;
    });

    return servicesResult;
};
