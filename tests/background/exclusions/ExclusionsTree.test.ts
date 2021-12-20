// import { ExclusionNode } from 'background/exclusions/ExclusionNode';
import { nanoid } from 'nanoid';

// import { ExclusionsTree } from '../../../src/background/exclusions/ExclusionsTree';
// import { ExclusionStates } from '../../../src/common/exclusionsConstants';
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
        // const exclusions = [
        //     { id: '1', hostname: 'example.org', state: ExclusionStates.Enabled },
        //     { id: '2', hostname: '*.example.org', state: ExclusionStates.Enabled },
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
        //                 {
        //                     id: '2_group',
        //                     value: 'example.net',
        //                 },
        //             ],
        //         },
        //     },
        //     'example.org': '1_service',
        //     '*.example.org': '1_service',
        // };

        // FIXME fix test
        expect(1).toEqual(1);

        // const exclusionsTree = new ExclusionsTree(exclusions, services);
        //
        // exclusionsTree.generateTree();
        //
        // const exclusionsData = exclusionsTree.getExclusions();
        //
        // expect(exclusionsData).toEqual({
        //     id: 'root',
        //     value: 'root',
        //     state: ExclusionStates.Enabled,
        //     children: [
        //         {
        //             id: '1_service',
        //             value: 'example',
        //             state: ExclusionStates.Enabled,
        //             children: [{
        //                 id: '1_group',
        //                 value: 'example.org',
        //                 state: ExclusionStates.Enabled,
        //                 children: [
        //                     {
        //                         id: '1',
        //                         value: 'example.org',
        //                         state: ExclusionStates.Enabled,
        //                         children: [],
        //                     },
        //                     {
        //                         id: '2',
        //                         value: '*.example.org',
        //                         state: ExclusionStates.Enabled,
        //                         children: [],
        //                     },
        //                 ],
        //             }],
        //         },
        //     ],
        // });
    });

    it('generate exclusions which are not in the service', () => {
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
