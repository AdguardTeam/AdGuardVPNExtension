/* eslint-disable no-console */

/**
 * Resolves the four-component version used by the release builds from the
 * CHANGELOG version.
 *
 * A beta keeps its own number, a release copies the last beta, so both ship
 * under the same version. The release is refused when the code changed since
 * that beta — the number would otherwise point at code that was never tested.
 *
 * Usage: resolve-version.ts <version>
 */

import { execFileSync, spawnSync } from 'node:child_process';

import { formatBuildVersion, formatCore, parseReleaseVersion } from './version';

/**
 * Paths that do not end up in the build, so changes in them do not require a
 * new beta. Anything not listed here counts as a build input — an unknown path
 * errs on the safe side and asks for a new beta.
 */
const EXCLUDED_PATHS = [
    '.eslintignore',
    '.eslintrc*',
    '.github',
    '.husky',
    '.lintstagedrc.mjs',
    '.nvmrc',
    '.sdd',
    '.twosky.json',
    '*.md',
    'scripts',
    'tasks/release',
    'tests',
    'vitest.config.ts',
];

/**
 * Prints the version in the `version=` form consumed by `$GITHUB_OUTPUT`.
 *
 * @param version Build version.
 */
const printVersion = (version: string): void => {
    console.log(`version=${version}`);
};

/**
 * Finds the last beta number published for the version core.
 *
 * @param core Version core, e.g. `2.12.0`.
 *
 * @returns Beta number, or `0` when there was no beta.
 */
const getLastBeta = (core: string): number => {
    const tags = execFileSync('git', ['tag', '--list', `v${core}*`], { encoding: 'utf8' }).split('\n');
    const escapedCore = core.replace(/\./g, '\\.');
    const betaTagRe = new RegExp(`^v${escapedCore}-beta\\.(\\d+)$`);

    let lastBeta = 0;
    tags.forEach((tag) => {
        const match = tag.match(betaTagRe);
        if (match) {
            const beta = Number(match[1]);
            if (beta > lastBeta) {
                lastBeta = beta;
            }
        }
    });

    return lastBeta;
};

/**
 * Ensures the build code did not change since the beta the release copies.
 *
 * @param betaTag Beta tag the release version is taken from.
 *
 * @throws If anything that goes into the build changed since that tag.
 */
const assertSameCode = (betaTag: string): void => {
    const args = [
        'diff',
        '--quiet',
        betaTag,
        'HEAD',
        '--',
        '.',
        ...EXCLUDED_PATHS.map((path) => `:(exclude)${path}`),
    ];
    const result = spawnSync('git', args, { stdio: 'ignore' });

    if (result.status === 0) {
        return;
    }
    if (result.status !== 1) {
        throw new Error(`Cannot compare ${betaTag} with HEAD (git diff exited with ${result.status})`);
    }

    throw new Error(
        `Code changed since ${betaTag}. Publish a new beta first, then release with the same number.`,
    );
};

/**
 * Resolves and prints the build version for the given CHANGELOG version.
 */
const main = (): void => {
    const input = process.argv[2];
    if (!input) {
        throw new Error('Usage: resolve-version.ts <version>');
    }

    const version = parseReleaseVersion(input);

    if (version.beta !== null) {
        printVersion(formatBuildVersion(version, version.beta));
        return;
    }

    const lastBeta = getLastBeta(formatCore(version));
    if (lastBeta === 0) {
        printVersion(formatBuildVersion(version, 1));
        return;
    }

    assertSameCode(`v${formatCore(version)}-beta.${lastBeta}`);
    printVersion(formatBuildVersion(version, lastBeta));
};

try {
    main();
} catch (error) {
    console.error(`Error resolving the build version: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
}
