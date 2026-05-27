import { type ProfileInfo } from '../../background/schema/profiles/profile';
import { translator } from '../translator';

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
export const MAX_PROFILE_NAME_LENGTH = 100;

/**
 * Result codes for profile name validation.
 */
export enum ProfileNameValidationResult {
    Ok = 'ok',
    Empty = 'empty',
    TooLong = 'too_long',
    DuplicateName = 'duplicate_name',
}

/**
 * Successful profile operation result.
 */
interface ProfileOperationSuccess {
    result: ProfileNameValidationResult.Ok;
    profileId: string;
}

/**
 * Failed profile operation result.
 */
interface ProfileOperationError {
    result: Exclude<ProfileNameValidationResult, ProfileNameValidationResult.Ok>;
}

/**
 * Response from create/rename profile operations.
 * Discriminated union that prevents invalid states
 * (e.g. Ok without profileId, or error with profileId).
 */
export type ProfileOperationResponse = ProfileOperationSuccess | ProfileOperationError;

/**
 * Returns true if the given profile ID belongs to the system default profile.
 *
 * @param profileId Profile ID to check.
 * @returns Whether the profile ID is the default one.
 */
export function isDefaultProfileId(profileId: ProfileInfo['id']): boolean {
    return profileId === DEFAULT_PROFILE_ID;
}

/**
 * Returns profile display name.
 * For the default profile returns the localized "Default" name.
 *
 * @param id Profile id.
 * @param name Profile name.
 * @returns Display name for the profile.
 */
export function getProfileDisplayName(id: string, name: string): string {
    if (isDefaultProfileId(id)) {
        return translator.getMessage('settings_profiles_default_name');
    }
    return name;
}

/**
 * Validates a profile name and checks for duplicates among existing names.
 *
 * @param name Profile name to validate.
 * @param profiles List of existing profiles.
 * @param editedProfileId ID of the profile being renamed. Omit when creating a new profile.
 * @returns {@link ProfileNameValidationResult.Ok} if valid, or an error code otherwise.
 */
export function validateProfileName(
    name: string,
    profiles: ProfileInfo[],
    editedProfileId?: string,
): ProfileNameValidationResult {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return ProfileNameValidationResult.Empty;
    }

    if (trimmed.length > MAX_PROFILE_NAME_LENGTH) {
        return ProfileNameValidationResult.TooLong;
    }

    const isDuplicate = profiles.some(
        (p) => p.id !== editedProfileId
            && p.name.toLowerCase() === trimmed.toLowerCase(),
    );

    if (isDuplicate) {
        return ProfileNameValidationResult.DuplicateName;
    }

    return ProfileNameValidationResult.Ok;
}
