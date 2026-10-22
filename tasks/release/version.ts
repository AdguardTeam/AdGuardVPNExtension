/**
 * Release version helpers.
 *
 * CHANGELOG versions have three components (`X.Y.Z`, `X.Y.Z-beta.N`), while
 * the builds are published under a four-component version (`X.Y.Z.N`), where
 * `N` is the build number inside `X.Y.Z`.
 */

/**
 * Release channel derived from the version.
 */
export type ReleaseChannel = 'beta' | 'release';

/**
 * Parsed CHANGELOG version.
 */
export type ReleaseVersion = {
    /**
     * Major version.
     */
    major: number;

    /**
     * Minor version.
     */
    minor: number;

    /**
     * Patch version.
     */
    patch: number;

    /**
     * Beta number, or `null` for a release.
     */
    beta: number | null;

    /**
     * Release channel.
     */
    channel: ReleaseChannel;
};

/**
 * Matches `X.Y.Z` and `X.Y.Z-beta.N`, with an optional `v` prefix.
 */
const RELEASE_VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:-beta\.(\d+))?$/;

/**
 * Parses a CHANGELOG version, optionally with the `v` prefix.
 *
 * @param input Version string, e.g. `2.12.0` or `v2.12.0-beta.1`.
 *
 * @returns Parsed version.
 *
 * @throws If the input is not a release or beta version.
 */
export const parseReleaseVersion = (input: string): ReleaseVersion => {
    const match = input.match(RELEASE_VERSION_RE);
    if (!match) {
        throw new Error(`Invalid release version "${input}": expected X.Y.Z or X.Y.Z-beta.N`);
    }

    const [, major, minor, patch, beta] = match;
    const parsedBeta = beta ? Number(beta) : null;

    return {
        major: Number(major),
        minor: Number(minor),
        patch: Number(patch),
        beta: parsedBeta,
        channel: parsedBeta === null ? 'release' : 'beta',
    };
};

/**
 * Formats the three-component core of the version.
 *
 * @param version Parsed version.
 *
 * @returns Version without the build number, e.g. `2.12.0`.
 */
export const formatCore = (version: ReleaseVersion): string => `${version.major}.${version.minor}.${version.patch}`;

/**
 * Formats the four-component version used by the builds and the stores.
 *
 * @param version Parsed version.
 * @param build Build number inside `X.Y.Z`.
 *
 * @returns Build version, e.g. `2.12.0.1`.
 */
export const formatBuildVersion = (version: ReleaseVersion, build: number): string => {
    return `${formatCore(version)}.${build}`;
};
