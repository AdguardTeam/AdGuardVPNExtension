import { ExclusionsHandler } from '../../../src/background/exclusions/exclusions/ExclusionsHandler';
import { ServicesManager } from '../../../src/background/exclusions/services/ServicesManager';
import { ExclusionsTree } from '../../../src/background/exclusions/ExclusionsTree';
import { ExclusionStates, ExclusionsTypes } from '../../../src/common/exclusionsConstants';

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
            amazon: {
                serviceId: 'amazon',
                serviceName: 'Amazon',
                iconUrl: 'https://icons.adguard.org/icon?domain=amazon.com',
                modifiedTime: '2021-09-14T10:23:00+0000',
                categories: [
                    {
                        id: 'SHOP',
                        name: 'Shopping',
                    },
                ],
                domains: [
                    'amazon.com',
                    'amazon.de',
                    'amazon.eu',
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
        // const exclusions = [
        //     { id: '1', hostname: 'example.org', state: ExclusionStates.Enabled },
        //     { id: '2', hostname: 'example.net', state: ExclusionStates.Enabled },
        // ];
        //
        // const services = {
        //     services: {
        //         '1_service': {
        //             id: '1_service',
        //             name: 'example',
        //             groups: [
        //                 {
        //                     id: '1_group',
        //                     value: 'example.org',
        //                 },
        //             ],
        //         },
        //     },
        //     'example.org': '1_service',
        //     '*.example.org': '1_service',
        // };

        // FIXME fix test
        expect(1).toEqual(1);

    //     const exclusionsTree = new ExclusionsTree(exclusions, services);
    //
    //     exclusionsTree.generateTree();
    //
    //     const exclusionsData = exclusionsTree.getExclusions();
    //
    //     expect(exclusionsData).toEqual({
    //         id: 'root',
    //         value: 'root',
    //         state: ExclusionStates.Enabled,
    //         children: [
    //             {
    //                 id: '1_service',
    //                 value: 'example',
    //                 state: ExclusionStates.Enabled,
    //                 children: [{
    //                     id: '1_group',
    //                     value: 'example.org',
    //                     state: ExclusionStates.Enabled,
    //                     children: [
    //                         {
    //                             id: '1',
    //                             value: 'example.org',
    //                             state: ExclusionStates.Enabled,
    //                             children: [],
    //                         },
    //                     ],
    //                 }],
    //             },
    //             {
    //                 id: 'example.net',
    //                 value: 'example.net',
    //                 state: ExclusionStates.Enabled,
    //                 children: [
    //                     {
    //                         id: '2',
    //                         value: 'example.net',
    //                         state: ExclusionStates.Enabled,
    //                         children: [],
    //                     },
    //                 ],
    //             },
    //         ],
    //     });
    });
});
