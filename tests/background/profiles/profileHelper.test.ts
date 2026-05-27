import { describe, it, expect } from 'vitest';

import {
    validateProfileName,
    MAX_PROFILE_NAME_LENGTH,
    ProfileNameValidationResult,
} from '../../../src/common/profiles';

describe('validateProfileName', () => {
    it('should accept a valid name', () => {
        expect(validateProfileName('Work', [])).toBe(ProfileNameValidationResult.Ok);
    });

    it('should accept a name at max length', () => {
        const name = 'a'.repeat(MAX_PROFILE_NAME_LENGTH);
        expect(validateProfileName(name, [])).toBe(ProfileNameValidationResult.Ok);
    });

    it('should reject an empty string', () => {
        expect(validateProfileName('', [])).toBe(ProfileNameValidationResult.Empty);
    });

    it('should reject a whitespace-only string', () => {
        expect(validateProfileName('   ', [])).toBe(ProfileNameValidationResult.Empty);
    });

    it('should reject a name exceeding max length', () => {
        const name = 'a'.repeat(MAX_PROFILE_NAME_LENGTH + 1);
        expect(validateProfileName(name, [])).toBe(ProfileNameValidationResult.TooLong);
    });

    it('should trim leading/trailing whitespace before checking length', () => {
        const name = `  ${'a'.repeat(MAX_PROFILE_NAME_LENGTH)}  `;
        expect(validateProfileName(name, [])).toBe(ProfileNameValidationResult.Ok);
    });

    it('should accept a unique name', () => {
        const profiles = [{ id: '1', name: 'Default' }, { id: '2', name: 'Work' }, { id: '3', name: 'Home' }];
        expect(validateProfileName('Gaming', profiles)).toBe(ProfileNameValidationResult.Ok);
    });

    it('should reject a duplicate name (exact match)', () => {
        const profiles = [{ id: '1', name: 'Default' }, { id: '2', name: 'Work' }, { id: '3', name: 'Home' }];
        expect(validateProfileName('Work', profiles)).toBe(ProfileNameValidationResult.DuplicateName);
    });

    it('should reject a duplicate name (case-insensitive)', () => {
        const profiles = [{ id: '1', name: 'Work' }];
        expect(validateProfileName('work', profiles)).toBe(ProfileNameValidationResult.DuplicateName);
        expect(validateProfileName('WORK', profiles)).toBe(ProfileNameValidationResult.DuplicateName);
    });

    it('should reject a duplicate name with surrounding whitespace', () => {
        const profiles = [{ id: '1', name: 'Work' }];
        expect(validateProfileName('  Work  ', profiles)).toBe(ProfileNameValidationResult.DuplicateName);
    });

    it('should accept any name when no existing profiles', () => {
        expect(validateProfileName('Work', [])).toBe(ProfileNameValidationResult.Ok);
    });

    it('should allow keeping the same name when renaming', () => {
        const profiles = [{ id: '1', name: 'Default' }, { id: '2', name: 'Work' }];
        expect(validateProfileName('Work', profiles, '2')).toBe(ProfileNameValidationResult.Ok);
    });

    it('should reject a duplicate when renaming to another profiles name', () => {
        const profiles = [{ id: '1', name: 'Default' }, { id: '2', name: 'Work' }];
        expect(validateProfileName('Default', profiles, '2')).toBe(ProfileNameValidationResult.DuplicateName);
    });
});
