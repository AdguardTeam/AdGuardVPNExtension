import { describe, expect, it } from 'vitest';

import {
    prepareExclusionsAfterImport,
} from '../../../../../src/options/components/Exclusions/Actions/prepareExclusionsAfterImport';

describe('prepareExclusionsAfterImport', () => {
    it('normalizes leading-dot exclusions and keeps reverse import order', () => {
        const result = prepareExclusionsAfterImport('.com\n.example.com\n*.com');

        expect(result).toEqual(['*.com', 'example.com', 'com']);
    });

    it('filters hard-invalid leading-dot exclusions', () => {
        const result = prepareExclusionsAfterImport('*..com\n..example.com\n.127.0.0.1\nco.uk');

        expect(result).toEqual(['co.uk']);
    });

    it('keeps already-valid inputs unchanged', () => {
        const result = prepareExclusionsAfterImport('example.com\n*.example.com\n127.0.0.1');

        expect(result).toEqual(['127.0.0.1', '*.example.com', 'example.com']);
    });

    it('accepts private/non-public TLDs that getETld does not recognize', () => {
        const result = prepareExclusionsAfterImport('nas.local\ngit.corp\n*.nas.local');

        expect(result).toEqual(['*.nas.local', 'git.corp', 'nas.local']);
    });
});
