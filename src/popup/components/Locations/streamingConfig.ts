/**
 * Streaming platform names.
 */
export enum StreamingPlatform {
    Netflix = 'Netflix',
    DisneyPlus = 'Disney+',
    Hulu = 'Hulu',
}

/**
 * Streaming platforms available for specific locations.
 */
export interface StreamingPlatforms {
    platforms: StreamingPlatform[];
}

/**
 * Mapping of location IDs to their supported streaming platforms.
 */
export const STREAMING_LOCATIONS: Record<string, StreamingPlatforms> = {
    // London - United Kingdom
    Z2JfbG9uZG9u: {
        platforms: [StreamingPlatform.Netflix, StreamingPlatform.DisneyPlus],
    },
    // Berlin - Germany
    ZGVfYmVybGlu: {
        platforms: [StreamingPlatform.Netflix, StreamingPlatform.DisneyPlus],
    },
    // Madrid - Spain
    ZXNfbWFkcmlk: {
        platforms: [StreamingPlatform.Netflix, StreamingPlatform.DisneyPlus],
    },
    // Toronto - Canada
    'Y2FfdG9yb250bw==': {
        platforms: [StreamingPlatform.Netflix, StreamingPlatform.DisneyPlus],
    },
    // Los Angeles - USA
    'dXNfbG9zX2FuZ2VsZXM=': {
        platforms: [StreamingPlatform.Netflix, StreamingPlatform.DisneyPlus, StreamingPlatform.Hulu],
    },
    // New York - USA
    'dXNfbmV3X3lvcms=': {
        platforms: [StreamingPlatform.Netflix, StreamingPlatform.DisneyPlus, StreamingPlatform.Hulu],
    },
    // Istanbul - Turkey
    'dHJfaXN0YW5idWw=': {
        platforms: [StreamingPlatform.Netflix, StreamingPlatform.DisneyPlus],
    },
    // Paris - France
    'ZnJfcGFyaXM=': {
        platforms: [StreamingPlatform.Netflix, StreamingPlatform.DisneyPlus],
    },
    // Seoul - South Korea
    'a3Jfc2VvdWw=': {
        platforms: [StreamingPlatform.Netflix],
    },
    // Tokyo - Japan
    'anBfdG9reW8=': {
        platforms: [StreamingPlatform.Netflix, StreamingPlatform.Hulu],
    },
};

/**
 * Check if a location supports streaming services.
 *
 * @param locationId Location ID to check.
 * @returns True if the location supports streaming services.
 */
export const hasStreamingSupport = (locationId: string): boolean => {
    return locationId in STREAMING_LOCATIONS;
};

/**
 * Get streaming platforms for a location.
 *
 * @param locationId Location ID.
 * @returns Array of streaming platform names, or empty array if not supported.
 */
export const getStreamingPlatforms = (locationId: string): string[] => {
    return STREAMING_LOCATIONS[locationId]?.platforms || [];
};
