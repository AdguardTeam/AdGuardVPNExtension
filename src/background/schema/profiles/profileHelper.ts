/**
 * Result codes for profile name validation.
 */
export enum ProfileNameError {
    Ok = 'ok',
    Empty = 'empty',
    TooLong = 'too_long',
}

/**
 * Maximum allowed length for a profile name.
 */
export const MAX_PROFILE_NAME_LENGTH = 40;

/**
 * Validates a profile name.
 *
 * @param name Profile name to validate.
 * @returns {@link ProfileNameError.Ok} if valid, or an error code otherwise.
 */
export function validateProfileName(name: string): ProfileNameError {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return ProfileNameError.Empty;
    }

    if (trimmed.length > MAX_PROFILE_NAME_LENGTH) {
        return ProfileNameError.TooLong;
    }

    return ProfileNameError.Ok;
}
