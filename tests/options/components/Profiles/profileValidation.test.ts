import {
    describe,
    it,
    expect,
    vi,
} from 'vitest';

import { MAX_PROFILE_NAME_LENGTH, ProfileNameValidationResult } from '../../../../src/common/profiles';
import { getValidationErrorMessage } from '../../../../src/options/components/Profiles/profileValidation';

const { mockGetMessage, mockGetPlural } = vi.hoisted(() => ({
    mockGetMessage: vi.fn((key: string, params?: Record<string, string>) => {
        if (params) {
            return `${key}::${JSON.stringify(params)}`;
        }
        return key;
    }),
    mockGetPlural: vi.fn((key: string, count: number) => {
        return `${key}::${count}`;
    }),
}));

vi.mock('../../../../src/common/translator', () => ({
    translator: {
        getMessage: mockGetMessage,
        getPlural: mockGetPlural,
    },
}));

describe('getValidationErrorMessage', () => {
    it('should return null for Ok result', () => {
        expect(getValidationErrorMessage(ProfileNameValidationResult.Ok)).toBeNull();
    });

    it('should return null for Empty code', () => {
        const error = getValidationErrorMessage(ProfileNameValidationResult.Empty);

        expect(error).toBeNull();
    });

    it('should return too long error with max length for TooLong code', () => {
        const error = getValidationErrorMessage(ProfileNameValidationResult.TooLong);

        expect(error).toBe(
            `settings_profiles_error_too_long::${MAX_PROFILE_NAME_LENGTH}`,
        );
    });

    it('should return duplicate name error for DuplicateName code', () => {
        const error = getValidationErrorMessage(ProfileNameValidationResult.DuplicateName);

        expect(error).toBe('settings_profiles_error_duplicate_name');
    });
});
