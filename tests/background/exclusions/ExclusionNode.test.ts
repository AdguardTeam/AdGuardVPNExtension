import { ExclusionNode } from '../../../src/background/exclusions/ExclusionNode';

describe('ExclusionNode', () => {
    describe('getPathExclusions', () => {
        it('returns one exclusion if no children found', () => {
            const tree = new ExclusionNode({ id: 'root', value: 'root' });
            tree.addChild(new ExclusionNode({ id: '1', value: 'example.org' }));
            tree.addChild(new ExclusionNode({ id: '2', value: 'example.net' }));

            const exclusions = tree.getPathExclusions('2');
            expect(exclusions).toEqual(['2']);
        });

        it('returns all leaf children', () => {
            const tree = new ExclusionNode({ id: 'root', value: 'root' });
            tree.addChild(new ExclusionNode({ id: '1', value: 'example.org' }));
            const secondExclusion = new ExclusionNode({ id: '2', value: 'example.net' });
            secondExclusion.addChild(new ExclusionNode({ id: '3', value: '*.example.net' }));
            secondExclusion.addChild(new ExclusionNode({ id: '4', value: 'test.example.net' }));
            tree.addChild(secondExclusion);

            const exclusions = tree.getPathExclusions('2');
            expect(exclusions).toEqual(['3', '4']);
        });
    });
});
