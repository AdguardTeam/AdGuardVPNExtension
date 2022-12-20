import { ExclusionsHandler } from '../../../src/background/exclusions/exclusions/ExclusionsHandler';
import { ServicesManager } from '../../../src/background/exclusions/services/ServicesManager';
import { ExclusionsTree } from '../../../src/background/exclusions/ExclusionsTree';
import { ExclusionState, ExclusionsTypes } from '../../../src/common/exclusionsConstants';
import { ExclusionInterface } from '../../../src/background/exclusions/exclusions/exclusionsTypes';

jest.mock('../../../src/lib/logger.ts');

describe('ExclusionsTree', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('generates exclusions which are not in the service', () => {
        const exclusions: ExclusionInterface[] = [
            { id: '1', hostname: 'example.org', state: ExclusionState.Enabled },
            { id: '2', hostname: '*.example.org', state: ExclusionState.Enabled },
        ];

        const indexedExclusions = ExclusionsHandler.buildExclusionsIndex(exclusions);

        const services = {};

        const indexedServices = ServicesManager.getServicesIndex(services);

        const exclusionsTree = new ExclusionsTree();

        exclusionsTree.generateTree({
            exclusions,
            indexedExclusions,
            services,
            indexedServices,
        });

        const exclusionsData = exclusionsTree.getExclusions();

        expect(exclusionsData.children).toEqual([
            {
                id: 'example.org',
                hostname: 'example.org',
                state: ExclusionState.Enabled,
                type: ExclusionsTypes.Group,
                parentId: 'root',
                children: [
                    {
                        id: '1',
                        hostname: 'example.org',
                        state: ExclusionState.Enabled,
                        type: ExclusionsTypes.Exclusion,
                        parentId: 'example.org',
                        children: [],
                    },
                    {
                        id: '2',
                        hostname: '*.example.org',
                        state: ExclusionState.Enabled,
                        type: ExclusionsTypes.Exclusion,
                        parentId: 'example.org',
                        children: [],
                    },
                ],
            },
        ]);
    });

    it('generate exclusions which are in the service', () => {
        const exclusions: ExclusionInterface[] = [
            { id: '0', hostname: 'aliexpress.com', state: ExclusionState.Enabled },
            { id: '1', hostname: '*.aliexpress.com', state: ExclusionState.Enabled },
            { id: '2', hostname: 'aliexpress.ru', state: ExclusionState.Enabled },
            { id: '3', hostname: '*.aliexpress.ru', state: ExclusionState.Enabled },
        ];

        const indexedExclusions = ExclusionsHandler.buildExclusionsIndex(exclusions);

        const services = {
            aliexpress: {
                serviceId: 'aliexpress',
                serviceName: 'Aliexpress',
                iconUrl: 'https://icons.adguard.org/icon?domain=aliexpress.com',
                modifiedTime: '2021-09-14T10:23:00+0000',
                categories: [
                    {
                        id: 'SHOP',
                        name: 'Shopping',
                    },
                ],
                domains: [
                    'aliexpress.com',
                    'aliexpress.ru',
                ],
            },
        };

        const indexedServices = ServicesManager.getServicesIndex(services);

        const exclusionsTree = new ExclusionsTree();

        exclusionsTree.generateTree({
            exclusions,
            indexedExclusions,
            services,
            indexedServices,
        });

        const exclusionsData = exclusionsTree.getExclusions();

        expect(exclusionsData.children).toEqual([
            {
                id: 'aliexpress',
                hostname: 'Aliexpress',
                state: ExclusionState.Enabled,
                type: ExclusionsTypes.Service,
                iconUrl: 'https://icons.adguard.org/icon?domain=aliexpress.com',
                parentId: 'root',
                children: [{
                    id: 'aliexpress.com',
                    hostname: 'aliexpress.com',
                    state: ExclusionState.Enabled,
                    type: ExclusionsTypes.Group,
                    parentId: 'aliexpress',
                    children: [
                        {
                            id: '0',
                            hostname: 'aliexpress.com',
                            state: ExclusionState.Enabled,
                            type: ExclusionsTypes.Exclusion,
                            parentId: 'aliexpress.com',
                            children: [],
                        },
                        {
                            id: '1',
                            hostname: '*.aliexpress.com',
                            state: ExclusionState.Enabled,
                            type: ExclusionsTypes.Exclusion,
                            parentId: 'aliexpress.com',
                            children: [],
                        },
                    ],
                },
                {
                    id: 'aliexpress.ru',
                    hostname: 'aliexpress.ru',
                    state: ExclusionState.Enabled,
                    type: ExclusionsTypes.Group,
                    parentId: 'aliexpress',
                    children: [
                        {
                            id: '2',
                            hostname: 'aliexpress.ru',
                            state: ExclusionState.Enabled,
                            type: ExclusionsTypes.Exclusion,
                            parentId: 'aliexpress.ru',
                            children: [],
                        },
                        {
                            id: '3',
                            hostname: '*.aliexpress.ru',
                            state: ExclusionState.Enabled,
                            type: ExclusionsTypes.Exclusion,
                            parentId: 'aliexpress.ru',
                            children: [],
                        },
                    ],
                },
                ],
            }]);
    });

    it('works fast', () => {
        // eslint-disable-next-line global-require
        const exclusions: ExclusionInterface[] = require('./exclusions.json');

        const indexedExclusions = ExclusionsHandler.buildExclusionsIndex(exclusions);

        // eslint-disable-next-line global-require
        const services = require('./services.json');

        const indexedServices = ServicesManager.getServicesIndex(services);

        const exclusionsTree = new ExclusionsTree();

        const runs = 10;
        let total = 0;
        for (let i = 0; i < runs; i += 1) {
            const start = performance.now();
            exclusionsTree.generateTree({
                exclusions,
                indexedExclusions,
                services,
                indexedServices,
            });
            const end = performance.now();
            total += end - start;
        }

        const average = total / runs;
        // @ts-ignore
        const domains = Object.values(services).flatMap((service) => service.domains);
        // eslint-disable-next-line no-console
        console.log(`
        For ${exclusions.length} exclusions and ${Object.values(services).length} services with ${domains.length} domains
        ExclusionsTree was generated in: ${average} ms
        On MacBook Pro (15-inch, 2019), with 2,6 GHz 6-Core Intel Core i7 and 16 GB 2400 MHz DDR4 is built in ~30-40ms
        `);
        const MAX_BUILD_TIME = 150;
        expect(average).toBeLessThan(MAX_BUILD_TIME);
    });
});
