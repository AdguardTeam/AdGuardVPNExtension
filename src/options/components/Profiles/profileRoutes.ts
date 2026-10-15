/**
 * Base route path for the profiles section.
 */
export const PROFILES_PATH = '/profiles';

/**
 * Query parameter that keeps the screen a profile sub-screen was opened from.
 * Router state cannot be used here: hash history drops it.
 */
export const PROFILE_ORIGIN_QUERY_PARAM = 'from';

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

/**
 * Adds the origin of the navigation to a profile sub-screen route.
 *
 * @param route Route path to a profile sub-screen.
 * @param origin Path of the screen the sub-screen is opened from.
 * @returns Route path with the origin query parameter.
 */
export function withProfileOrigin(route: string, origin: string): string {
    return `${route}?${PROFILE_ORIGIN_QUERY_PARAM}=${encodeURIComponent(origin)}`;
}

/**
 * Resolves the screen to return to from a profile sub-screen.
 *
 * @param search Search string of the current location.
 * @param profileId Profile ID the sub-screen belongs to.
 * @returns Path to return to on back navigation.
 */
export function getProfileSubScreenOrigin(search: string, profileId: string): string {
    const origin = new URLSearchParams(search).get(PROFILE_ORIGIN_QUERY_PARAM);

    if (!origin || !origin.startsWith('/')) {
        return getProfileRoute(profileId);
    }

    return origin;
}
