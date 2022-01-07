import { coveredBy, ExclusionNode, selectConsiderable } from '../../../src/background/exclusions/ExclusionNode';
import { ExclusionState } from '../../../src/common/exclusionsConstants';

describe('ExclusionNode', () => {
    it('ignores state of exclusions, which are covered by wildcard exclusions during state calculations', () => {
        const tree = new ExclusionNode({ id: 'example.org', hostname: 'example.org' });
        tree.addChild(new ExclusionNode({ id: '0', hostname: 'example.org', state: ExclusionState.Enabled }));
        tree.addChild(new ExclusionNode({ id: '1', hostname: '*.example.org', state: ExclusionState.Enabled }));
        tree.addChild(new ExclusionNode({ id: '2', hostname: 'test.example.org', state: ExclusionState.Disabled }));

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
            { hostname: 'example.org' },
            { hostname: '*.example.org' },
            { hostname: 'test.example.org' },
        ];

        expect(selectConsiderable(nodes)).toEqual([{ hostname: 'example.org' }, { hostname: '*.example.org' }]);
    });

    describe('getPathExclusions', () => {
        it('returns one exclusion if no children found', () => {
            const tree = new ExclusionNode({ id: 'root', hostname: 'root' });
            tree.addChild(new ExclusionNode({ id: '1', hostname: 'example.org' }));
            tree.addChild(new ExclusionNode({ id: '2', hostname: 'example.net' }));

            const exclusions = tree.getPathExclusions('2');
            expect(exclusions).toEqual(['2']);
        });

        it('returns all leaf children', () => {
            const tree = new ExclusionNode({ id: 'root', hostname: 'root' });
            tree.addChild(new ExclusionNode({ id: '1', hostname: 'example.org' }));
            const secondExclusion = new ExclusionNode({ id: '2', hostname: 'example.net' });
            secondExclusion.addChild(new ExclusionNode({ id: '3', hostname: '*.example.net' }));
            secondExclusion.addChild(new ExclusionNode({ id: '4', hostname: 'test.example.net' }));
            tree.addChild(secondExclusion);

            const exclusions = tree.getPathExclusions('2');
            expect(exclusions).toEqual(['3', '4']);
        });
    });

    describe('getParentExclusionNode', () => {
        it('returns parent exclusion node or null', () => {
            const tree = new ExclusionNode({ id: 'root', hostname: 'root' });
            tree.addChild(new ExclusionNode({ id: '1', hostname: 'example.org' }));

            const exclusion = new ExclusionNode({ id: '2', hostname: 'example.net' });
            exclusion.addChild(new ExclusionNode({ id: '3', hostname: 'test.example.net' }));

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
