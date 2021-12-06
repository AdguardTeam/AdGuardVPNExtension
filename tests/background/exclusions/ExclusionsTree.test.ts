import { nanoid } from 'nanoid';

import { ExclusionsTree } from '../../../src/background/exclusions/ExclusionsTree';
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
        const exclusionsTree = new ExclusionsTree();

        exclusionsTree.addExclusion('https://example.org');

        const exclusions = exclusionsTree.getExclusions();

        expect(exclusions).toEqual({
            id: '0',
            value: 'root',
            state: ExclusionStates.Enabled,
            children: [{
                id: '2',
                value: 'example.org',
                state: ExclusionStates.Enabled,
                children: [
                    {
                        id: '0',
                        value: 'example.org',
                        state: ExclusionStates.Enabled,
                        children: [],
                    },
                    {
                        id: '1',
                        value: '*.example.org',
                        state: ExclusionStates.Enabled,
                        children: [],
                    },
                ],
            }],
        });
    });

    it('removes exclusions', () => {
        const exclusionsTree = new ExclusionsTree();
        exclusionsTree.addExclusion('https://example.org');
        exclusionsTree.removeExclusion('2');

        const exclusions = exclusionsTree.getExclusions();
        expect(exclusions).toEqual([]);
    });
});
