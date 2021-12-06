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
                1: {
                    id: '1',
                    name: 'example',
                    groups: [
                        {
                            id: '1',
                            value: 'example.org',
                        },
                        {
                            id: '2',
                            value: 'example.net',
                        },
                    ],
                },
            },
            'example.org': '1',
            '*.example.org': '1',
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
                    id: '1',
                    value: 'example',
                    state: ExclusionStates.Enabled,
                    children: [{
                        id: '1',
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

    // it('removes exclusions', () => {
    //     const exclusionsTree = new ExclusionsHandler();
    //     exclusionsTree.addExclusionByUrl('https://example.org');
    //     exclusionsTree.removeExclusion('2');
    //
    //     const exclusions = exclusionsTree.getExclusions();
    //     expect(exclusions).toEqual([]);
    // });
});
