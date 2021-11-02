import { ExclusionsGroup } from './ExclusionsGroup.ts';
import { Service, ServiceInterface, ServiceBackendInterface } from './Service.ts';
import vpnProvider from '../providers/vpnProvider';

interface ExclusionsData {
    services: Service[],
    exclusionsGroups: ExclusionsGroup[],
}

class ExclusionsManager implements ExclusionsData {
    services: Service[];

    exclusionsGroups: ExclusionsGroup[];

    constructor() {
        this.services = [];
        this.exclusionsGroups = [];
    }

    setExclusionsGroups(exclusionsGroups: ExclusionsGroup[]) {
        this.exclusionsGroups = exclusionsGroups;
    }

    setExclusionsServices(services: Service[]) {
        this.services = services;
    }

    async init() {
        await this.getServices();
    }

    async getServices() {
        const services = await vpnProvider.getExclusionsServices();
        console.log('%%%%%%%%%%%%%%');
        console.log(services);
        console.log('%%%%%%%%%%%%%%');
        const servicesIds = services.map((service: ServiceBackendInterface) => service.serviceId);
        console.log(servicesIds);
        console.log('%%%%%%%%%%%%%%');
        const serviceDomains = await vpnProvider.getExclusionsServicesDomains(servicesIds);
        console.log(serviceDomains);
        console.log('%%%%%%%%%%%%%%');

        services.forEach((service: ServiceBackendInterface) => {
            const exclusionService = new Service(service);
            this.addService(exclusionService);
        });
    }

    addService(service: Service) {
        // TODO do to not forget to check prev values
        this.services.push(service);
    }

    // getExclusionsData() {
    //     const result: ExclusionsData = {
    //         services: [],
    //         exclusionsGroups: [],
    //     };
    //
    //     this.exclusionsServices.forEach((service) => {
    //         this.exclusions.forEach((exclusion) => {
    //             const found = service.domains.some((domain) => domain === exclusion.name);
    //             if (found) {
    //                 result.services.push({
    //                     id: service.id,
    //                     name: service.name,
    //                     enabled: true, // TODO calculate dynamically
    //                     exclusions: [exclusion.id],
    //                 });
    //                 result.exclusions.push({
    //                     id: exclusion.id,
    //                     name: exclusion.name,
    //                     enabled: true,
    //                 });
    //             }
    //         });
    //     });
    //
    //     return result;
    // }
    //
    // addExclusion(url: string) {
    //     const exclusion = new Exclusion(url);
    //
    //     // TODO do to not forget to check prev values
    //     this.exclusions.push(exclusion);
    // }
    //
    // removeExclusion() {
    //
    // }
}

export const exclusionsManager = new ExclusionsManager();
