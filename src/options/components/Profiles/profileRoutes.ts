/**
 * Base route path for the profiles section.
 */
export const PROFILES_PATH = '/profiles';

/**
 * Builds the route path to a profile detail page.
 *
 * @param profileId Profile ID to navigate to.
 * @returns Route path string.
 */
export function getProfileRoute(profileId: string): string {
    return `${PROFILES_PATH}/${profileId}`;
}

/**
 * Builds the route path to a profile's DNS settings page.
 *
 * @param profileId Profile ID.
 * @returns Route path string.
 */
export function getProfileDnsRoute(profileId: string): string {
    return `${PROFILES_PATH}/${profileId}/dns`;
}

/**
 * Builds the route path to a profile's location settings page.
 *
 * @param profileId Profile ID.
 * @returns Route path string.
 */
export function getProfileLocationRoute(profileId: string): string {
    return `${PROFILES_PATH}/${profileId}/location`;
}

/**
 * Builds the route path to a profile's exclusions page.
 *
 * @param profileId Profile ID.
 * @returns Route path string.
 */
export function getProfileExclusionsRoute(profileId: string): string {
    return `${PROFILES_PATH}/${profileId}/exclusions`;
}
