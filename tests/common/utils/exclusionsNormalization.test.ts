import { describe, expect, it } from 'vitest';

import {
    ExclusionInputCategory,
    getExclusionInputCategory,
    getNormalizedExclusionHostname,
    normalizeExclusionHostname,
} from '../../../src/common/utils/exclusionsNormalization';

describe('exclusionsNormalization', () => {
    describe('normalizeExclusionHostname', () => {
        it.each([
            ['.com', 'com'],
            ['.co.uk', 'co.uk'],
            ['.example.com', 'example.com'],
            [' .example.com ', 'example.com'],
            ['com', 'com'],
            ['*.com', '*.com'],
            ['example.com', 'example.com'],
            ['*.example.com', '*.example.com'],
        ])('normalizes %s to %s', (input, expected) => {
            expect(normalizeExclusionHostname(input)).toBe(expected);
        });

        it.each([
            '',
            '   ',
            '.',
            '..',
            '..com',
            '...com',
            '*..com',
            '*..example.com',
            '.127.0.0.1',
        ])('rejects hard-invalid hostname %s', (input) => {
            expect(normalizeExclusionHostname(input)).toBeNull();
        });
    });

    describe('getNormalizedExclusionHostname', () => {
        it.each([
            ['https://.example.com/path', 'example.com'],
            [' .com ', 'com'],
            ['*.example.com', '*.example.com'],
        ])('extracts and normalizes %s', (input, expected) => {
            expect(getNormalizedExclusionHostname(input)).toBe(expected);
        });
    });

    describe('getExclusionInputCategory', () => {
        it.each([
            ['.example.com', ExclusionInputCategory.Valid],
            ['example.com', ExclusionInputCategory.Valid],
            ['*.example.com', ExclusionInputCategory.Valid],
            ['.co.uk', ExclusionInputCategory.Valid],
            ['co.uk', ExclusionInputCategory.Valid],
            ['*.co.uk', ExclusionInputCategory.Valid],
            ['127.0.0.1', ExclusionInputCategory.Valid],
            ['*.127.0.0.1', ExclusionInputCategory.Valid],
            ['com', ExclusionInputCategory.Confirmable],
            ['.com', ExclusionInputCategory.Confirmable],
            ['*.com', ExclusionInputCategory.Confirmable],
            ['*.org', ExclusionInputCategory.Confirmable],
            ['*.net', ExclusionInputCategory.Confirmable],
            ['..com', ExclusionInputCategory.Invalid],
            ['*..com', ExclusionInputCategory.Invalid],
            ['.', ExclusionInputCategory.Invalid],
            ['.127.0.0.1', ExclusionInputCategory.Invalid],
            ['aaaaa', ExclusionInputCategory.Invalid],
            ['*.aaaaa', ExclusionInputCategory.Invalid],
            ['not valid', ExclusionInputCategory.Invalid],
        ])('classifies %s as %s', (input, expected) => {
            expect(getExclusionInputCategory(input)).toBe(expected);
        });
    });
});
