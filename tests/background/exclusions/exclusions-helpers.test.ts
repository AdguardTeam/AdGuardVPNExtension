import { ExclusionState } from '../../../src/common/exclusionsConstants';
import { complementExclusions } from '../../../src/background/exclusions/exclusions-helpers';
import { ExclusionInterface } from '../../../src/background/exclusions/exclusions/exclusionsTypes';

jest.mock('../../../src/lib/logger.js');

describe('complementExclusions', () => {
    it('complements exclusions', () => {
        const exclusions: ExclusionInterface[] = [
            { id: '1', hostname: 'example.org', state: ExclusionState.Enabled },
        ];

        const complementedExclusions = complementExclusions(exclusions);

        expect(complementedExclusions
            .map((ex) => ({ hostname: ex.hostname, state: ex.state }))).toEqual(
            [
                { hostname: 'example.org', state: ExclusionState.Enabled },
                { hostname: '*.example.org', state: ExclusionState.Disabled },
            ],
        );
    });
});
