import { nanoid } from 'nanoid';

import { ExclusionsHandler } from '../../../src/background/exclusions/ExclusionsHandler2';
import { ExclusionStates } from '../../../src/common/exclusionsConstants';
import clearAllMocks = jest.clearAllMocks;

jest.mock('nanoid');

const nanoidMock = nanoid as jest.MockedFunction<() => string>;
nanoidMock.mockImplementation((() => {
    let counter = 0;
    return () => {
        const currentId = counter;
        counter += 1;
        return currentId.toString();
    };
})());

describe('ExclusionsTree', () => {
    afterEach(() => {
        clearAllMocks();
    });

    it('adds exclusions', () => {
        const exclusions = [
            { id: '1', hostname: 'example.org', state: ExclusionStates.Enabled },
            { id: '2', hostname: '*.example.org', state: ExclusionStates.Enabled },
        ];

        const services = {
            services: {
                '1_service': {
                    id: '1_service',
                    name: 'example',
                    groups: [
                        {
                            id: '1_group',
                            value: 'example.org',
                        },
                        {
                            id: '2_group',
                            value: 'example.net',
                        },
                    ],
                },
            },
            'example.org': '1_service',
            '*.example.org': '1_service',
        };

        const exclusionHandler = new ExclusionsHandler(exclusions, services);

        exclusionHandler.generateTree();

        const exclusionsTree = exclusionHandler.getExclusions();

        expect(exclusionsTree).toEqual({
            id: 'root',
            value: 'root',
            state: ExclusionStates.Enabled,
            children: [
                {
                    id: '1_service',
                    value: 'example',
                    state: ExclusionStates.Enabled,
                    children: [{
                        id: '1_group',
                        value: 'example.org',
                        state: ExclusionStates.Enabled,
                        children: [
                            {
                                id: '1',
                                value: 'example.org',
                                state: ExclusionStates.Enabled,
                                children: [],
                            },
                            {
                                id: '2',
                                value: '*.example.org',
                                state: ExclusionStates.Enabled,
                                children: [],
                            },
                        ],
                    }],
                },
            ],
        });
    });

    it('adds exclusions which is not in the service', () => {
        const exclusions = [
            { id: '1', hostname: 'example.org', state: ExclusionStates.Enabled },
            { id: '2', hostname: 'example.net', state: ExclusionStates.Enabled },
        ];

        const services = {
            services: {
                '1_service': {
                    id: '1_service',
                    name: 'example',
                    groups: [
                        {
                            id: '1_group',
                            value: 'example.org',
                        },
                    ],
                },
            },
            'example.org': '1_service',
            '*.example.org': '1_service',
        };

        const exclusionHandler = new ExclusionsHandler(exclusions, services);

        exclusionHandler.generateTree();

        const exclusionsTree = exclusionHandler.getExclusions();

        expect(exclusionsTree).toEqual({
            id: 'root',
            value: 'root',
            state: ExclusionStates.Enabled,
            children: [
                {
                    id: '1_service',
                    value: 'example',
                    state: ExclusionStates.Enabled,
                    children: [{
                        id: '1_group',
                        value: 'example.org',
                        state: ExclusionStates.Enabled,
                        children: [
                            {
                                id: '1',
                                value: 'example.org',
                                state: ExclusionStates.Enabled,
                                children: [],
                            },
                        ],
                    }],
                },
                {
                    id: 'example.net',
                    value: 'example.net',
                    state: ExclusionStates.Enabled,
                    children: [
                        {
                            id: '2',
                            value: 'example.net',
                            state: ExclusionStates.Enabled,
                            children: [],
                        },
                    ],
                },
            ],
        });
    });

    it('removes exclusions', () => {
        const exclusions = [
            { id: '1', hostname: 'example.org', state: ExclusionStates.Enabled },
            { id: '2', hostname: '*.example.org', state: ExclusionStates.Enabled },
        ];

        const services = {
            services: {
                '1_service': {
                    id: '1_service',
                    name: 'example',
                    groups: [
                        {
                            id: '1_group',
                            value: 'example.org',
                        },
                        {
                            id: '2_group',
                            value: 'example.net',
                        },
                    ],
                },
            },
            'example.org': '1_service',
            '*.example.org': '1_service',
        };

        const exclusionHandler = new ExclusionsHandler(exclusions, services);
        exclusionHandler.generateTree();

        exclusionHandler.removeExclusion('1');

        const exclusionsTree = exclusionHandler.getExclusions();

        expect(exclusionsTree).toEqual({
            id: 'root',
            value: 'root',
            state: ExclusionStates.Enabled,
            children: [
                {
                    id: '1_service',
                    value: 'example',
                    state: ExclusionStates.Enabled,
                    children: [{
                        id: '1_group',
                        value: 'example.org',
                        state: ExclusionStates.Enabled,
                        children: [
                            {
                                id: '2',
                                value: '*.example.org',
                                state: ExclusionStates.Enabled,
                                children: [],
                            },
                        ],
                    }],
                },
            ],
        });
    });
});
