import { describe, it, expect } from 'vitest';

import { validateProfileName, MAX_PROFILE_NAME_LENGTH, ProfileNameError } from '../../../src/common/profilesConstants';

describe('validateProfileName', () => {
    it('should accept a valid name', () => {
        expect(validateProfileName('Work')).toBe(ProfileNameError.Ok);
    });

    it('should accept a name at max length', () => {
        const name = 'a'.repeat(MAX_PROFILE_NAME_LENGTH);
        expect(validateProfileName(name)).toBe(ProfileNameError.Ok);
    });

    it('should reject an empty string', () => {
        expect(validateProfileName('')).toBe(ProfileNameError.Empty);
    });

    it('should reject a whitespace-only string', () => {
        expect(validateProfileName('   ')).toBe(ProfileNameError.Empty);
    });

    it('should reject a name exceeding max length', () => {
        const name = 'a'.repeat(MAX_PROFILE_NAME_LENGTH + 1);
        expect(validateProfileName(name)).toBe(ProfileNameError.TooLong);
    });

    it('should trim leading/trailing whitespace before checking length', () => {
        const name = `  ${'a'.repeat(MAX_PROFILE_NAME_LENGTH)}  `;
        expect(validateProfileName(name)).toBe(ProfileNameError.Ok);
    });
});
