import { MAX_PROFILE_NAME_LENGTH, ProfileNameValidationResult } from '../../../common/profiles';
import { translator } from '../../../common/translator';

/**
 * Returns a map of validation results to translated error messages.
 * Called at validation time so messages reflect the current language.
 *
 * @returns Map of validation result codes to translated error messages.
 */
function getValidationMessages(): Record<ProfileNameValidationResult, string | null> {
    return {
        [ProfileNameValidationResult.Ok]: null,
        [ProfileNameValidationResult.Empty]: null,
        [ProfileNameValidationResult.TooLong]: translator.getPlural(
            'settings_profiles_error_too_long',
            MAX_PROFILE_NAME_LENGTH,
        ),
        [ProfileNameValidationResult.DuplicateName]: translator.getMessage('settings_profiles_error_duplicate_name'),
    };
}

/**
 * Returns a translated error message for a validation result code.
 *
 * @param result Validation result code from the backend.
 * @returns Translated error message, or null if the result is Ok.
 */
export function getValidationErrorMessage(result: ProfileNameValidationResult): string | null {
    return getValidationMessages()[result];
}
