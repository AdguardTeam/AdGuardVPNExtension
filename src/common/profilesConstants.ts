import { type Profile } from '../background/schema/profiles/profile';

/**
 * ID of the system default profile.
 * Uses a fixed value so it survives across sessions.
 */
export const DEFAULT_PROFILE_ID = 'default';

/**
 * Maximum number of profiles (including the system Default profile).
 */
export const MAX_PROFILES_COUNT = 10;

/**
 * Maximum allowed length for a profile name.
 */
export const MAX_PROFILE_NAME_LENGTH = 40;

/**
 * Result codes for profile name validation.
 */
export enum ProfileNameError {
    Ok = 'ok',
    Empty = 'empty',
    TooLong = 'too_long',
}

/**
 * Returns true if the given profile ID belongs to the system default profile.
 *
 * @param profileId Profile ID to check.
 * @returns Whether the profile ID is the default one.
 */
export function isDefaultProfileId(profileId: string): boolean {
    return profileId === DEFAULT_PROFILE_ID;
}

/**
 * Returns true if the profile is the system default.
 *
 * @param profile Profile to check.
 * @returns Whether the profile is the system default.
 */
export function isDefaultProfile(profile: Profile): boolean {
    return isDefaultProfileId(profile.id);
}

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
