import { ExclusionsHandler, getETld } from '../../../../src/background/exclusions/exclusions/ExclusionsHandler';
import { ExclusionStates } from '../../../../src/common/exclusionsConstants';

describe('ExclusionsHandler', () => {
    describe('getExclusionsIndex', () => {
        it('indexes exclusions', () => {
            const exclusions = [
                { id: '1', hostname: 'example.org', state: ExclusionStates.Enabled },
                { id: '2', hostname: '*.example.org', state: ExclusionStates.Enabled },
            ];

            const indexedExclusions = ExclusionsHandler.getExclusionsIndex(exclusions);

            expect(indexedExclusions).toEqual({
                'example.org': ['1', '2'],
            });
        });
    });

    describe('getETld', () => {
        it('returns eTld + 1 in the simple cases', () => {
            const eTld = getETld('example.org');
            expect(eTld).toEqual('example.org');
        });

        it('returns eTld + 1 for wildcard', () => {
            const eTld = getETld('*.example.org');
            expect(eTld).toEqual('example.org');
        });

        it('returns eTld + 1 for third level domain', () => {
            const eTld = getETld('test.example.org');
            expect(eTld).toEqual('example.org');
        });

        it('returns ip as is', () => {
            const eTld = getETld('192.168.1.1');
            expect(eTld).toEqual('192.168.1.1');
        });
    });
});
