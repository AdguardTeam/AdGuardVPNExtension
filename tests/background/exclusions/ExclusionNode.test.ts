import { coveredBy, ExclusionNode, selectConsiderable } from '../../../src/background/exclusions/ExclusionNode';
import { ExclusionState } from '../../../src/common/exclusionsConstants';

describe('ExclusionNode', () => {
    it('ignores state of exclusions, which are covered by wildcard exclusions during state calculations', () => {
        const tree = new ExclusionNode({ id: 'example.org', value: 'example.org' });
        tree.addChild(new ExclusionNode({ id: '0', value: 'example.org', state: ExclusionState.Enabled }));
        tree.addChild(new ExclusionNode({ id: '1', value: '*.example.org', state: ExclusionState.Enabled }));
        tree.addChild(new ExclusionNode({ id: '2', value: 'test.example.org', state: ExclusionState.Disabled }));

        const exclusion = tree.getExclusionNode('example.org');
        expect(exclusion!.state).toBe(ExclusionState.Enabled);
    });

    describe('coveredBy', () => {
        expect(coveredBy('example.org', '*.org')).toBeTruthy();
        expect(coveredBy('test.example.org', '*.org')).toBeTruthy();
        expect(coveredBy('test.example.org', '*.example.org')).toBeTruthy();
        expect(coveredBy('test.example.org', 'mail.example.org')).toBeFalsy();
        expect(coveredBy('test.example.org', '*.example.net')).toBeFalsy();
        expect(coveredBy('example.org', '*.example.org')).toBeFalsy();
    });

    describe('selectConsiderable', () => {
        const nodes = [
            { value: 'example.org' },
            { value: '*.example.org' },
            { value: 'test.example.org' },
        ];

        expect(selectConsiderable(nodes)).toEqual([{ value: 'example.org' }, { value: '*.example.org' }]);
    });

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

    describe('getParentExclusionNode', () => {
        it('returns parent exclusion node or null', () => {
            const tree = new ExclusionNode({ id: 'root', value: 'root' });
            tree.addChild(new ExclusionNode({ id: '1', value: 'example.org' }));

            const exclusion = new ExclusionNode({ id: '2', value: 'example.net' });
            exclusion.addChild(new ExclusionNode({ id: '3', value: 'test.example.net' }));

            tree.addChild(exclusion);

            let parentNode = tree.getParentExclusionNode('1');
            expect(parentNode?.id).toEqual('root');

            parentNode = tree.getParentExclusionNode('2');
            expect(parentNode?.id).toEqual('root');

            parentNode = tree.getParentExclusionNode('3');
            expect(parentNode?.id).toEqual('2');

            parentNode = tree.getParentExclusionNode('4');
            expect(parentNode).toBeNull();

            parentNode = tree.getParentExclusionNode('root');
            expect(parentNode).toBeNull();
        });
    });
});
