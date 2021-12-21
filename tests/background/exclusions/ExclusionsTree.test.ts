import { ExclusionsHandler } from '../../../src/background/exclusions/exclusions/ExclusionsHandler';
import { ServicesManager } from '../../../src/background/exclusions/services/ServicesManager';
import { ExclusionsTree } from '../../../src/background/exclusions/ExclusionsTree';
import { ExclusionStates, ExclusionsTypes } from '../../../src/common/exclusionsConstants';

jest.mock('../../../src/lib/logger.js');

describe('ExclusionsTree', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('generates exclusions which are not in the service', () => {
        const exclusions = [
            { id: '1', hostname: 'example.org', state: ExclusionStates.Enabled },
            { id: '2', hostname: '*.example.org', state: ExclusionStates.Enabled },
        ];

        const indexedExclusions = ExclusionsHandler.getExclusionsIndex(exclusions);

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

        expect(exclusionsData).toEqual([
            {
                id: 'example.org',
                value: 'example.org',
                state: ExclusionStates.Enabled,
                type: ExclusionsTypes.Group,
                children: [
                    {
                        id: '1',
                        value: 'example.org',
                        state: ExclusionStates.Enabled,
                        type: ExclusionsTypes.Exclusion,
                        children: [],
                    },
                    {
                        id: '2',
                        value: '*.example.org',
                        state: ExclusionStates.Enabled,
                        type: ExclusionsTypes.Exclusion,
                        children: [],
                    },
                ],
            },
        ]);
    });

    it('generate exclusions which are in the service', () => {
        const exclusions = [
            { id: '0', hostname: 'aliexpress.com', state: ExclusionStates.Enabled },
            { id: '1', hostname: '*.aliexpress.com', state: ExclusionStates.Enabled },
            { id: '2', hostname: 'aliexpress.ru', state: ExclusionStates.Enabled },
            { id: '3', hostname: '*.aliexpress.ru', state: ExclusionStates.Enabled },
        ];

        const indexedExclusions = ExclusionsHandler.getExclusionsIndex(exclusions);

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

        expect(exclusionsData).toEqual([
            {
                id: 'aliexpress',
                value: 'Aliexpress',
                state: ExclusionStates.Enabled,
                type: ExclusionsTypes.Service,
                iconUrl: 'https://icons.adguard.org/icon?domain=aliexpress.com',
                children: [{
                    id: 'aliexpress.com',
                    value: 'aliexpress.com',
                    state: ExclusionStates.Enabled,
                    type: ExclusionsTypes.Group,
                    children: [
                        {
                            id: '0',
                            value: 'aliexpress.com',
                            state: ExclusionStates.Enabled,
                            type: ExclusionsTypes.Exclusion,
                            children: [],
                        },
                        {
                            id: '1',
                            value: '*.aliexpress.com',
                            state: ExclusionStates.Enabled,
                            type: ExclusionsTypes.Exclusion,
                            children: [],
                        },
                    ],
                },
                {
                    id: 'aliexpress.ru',
                    value: 'aliexpress.ru',
                    state: ExclusionStates.Enabled,
                    type: ExclusionsTypes.Group,
                    children: [
                        {
                            id: '2',
                            value: 'aliexpress.ru',
                            state: ExclusionStates.Enabled,
                            type: ExclusionsTypes.Exclusion,
                            children: [],
                        },
                        {
                            id: '3',
                            value: '*.aliexpress.ru',
                            state: ExclusionStates.Enabled,
                            type: ExclusionsTypes.Exclusion,
                            children: [],
                        },
                    ],
                },
                ],
            }]);
    });
});
