import { type LocationWithPing } from 'background/endpoints/LocationWithPing';

/**
 * Show a warning if there are more than 30% of unavailable locations.
 */
const UNAVAILABLE_LOCATIONS_THRESHOLD_PERCENTAGE = 30;

/**
 * Calculates percentage of unavailable locations.
 *
 * @param locations List of all locations.
 *
 * @returns Percentage of unavailable locations.
 */
const getUnavailableLocationsPercentage = (locations: LocationWithPing[]): number => {
    const unavailableLocations = locations.filter((location) => !location.available);
    return (unavailableLocations.length / locations.length) * 100;
};

/**
 * Checks if number of locations is acceptable —
 * if there are more than {@link UNAVAILABLE_LOCATIONS_THRESHOLD_PERCENTAGE} of unavailable locations.
 *
 * @param locations List of locations.
 *
 * @returns True if number of locations is acceptable, otherwise false.
 */
export const isLocationsNumberAcceptable = (locations: LocationWithPing[]): boolean => {
    return typeof locations === 'undefined'
        || locations.length === 0
        || getUnavailableLocationsPercentage(locations) >= UNAVAILABLE_LOCATIONS_THRESHOLD_PERCENTAGE;
};
