import { nanoid } from 'nanoid';

import { ExclusionNode, ExclusionsTree } from '../../../src/background/exclusions/ExclusionsTree';
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

    it('generate exclusions which are in the service', () => {
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

        const exclusionsTree = new ExclusionsTree(exclusions, services);

        exclusionsTree.generateTree();

        const exclusionsData = exclusionsTree.getExclusions();

        expect(exclusionsData).toEqual({
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

    it('generate exclusions which are not in the service', () => {
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

        const exclusionsTree = new ExclusionsTree(exclusions, services);

        exclusionsTree.generateTree();

        const exclusionsData = exclusionsTree.getExclusions();

        expect(exclusionsData).toEqual({
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

    describe('ExclusionNode', () => {
        describe('getPathExclusions', () => {
            it('returns one exclusion if no children found', () => {
                const tree = new ExclusionNode('root', 'root');
                tree.addChild(new ExclusionNode('1', 'example.org'));
                tree.addChild(new ExclusionNode('2', 'example.net'));

                const exclusions = tree.getPathExclusions('2');
                expect(exclusions).toEqual(['2']);
            });

            it('returns all leaf children', () => {
                const tree = new ExclusionNode('root', 'root');
                tree.addChild(new ExclusionNode('1', 'example.org'));
                const secondExclusion = new ExclusionNode('2', 'example.net');
                secondExclusion.addChild(new ExclusionNode('3', '*.example.net'));
                secondExclusion.addChild(new ExclusionNode('4', 'test.example.net'));
                tree.addChild(secondExclusion);

                const exclusions = tree.getPathExclusions('2');
                expect(exclusions).toEqual(['3', '4']);
            });
        });
    });
});
