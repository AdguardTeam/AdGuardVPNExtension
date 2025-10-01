/**
 * @file Bundle size update script
 * Updates the bundle size record for a specific build environment and target
 * after successful deployment.
 *
 * Usage: Should be run after a build is validated to update the reference size.
 */
/* eslint-disable no-console */

import fs from 'node:fs';

import { Browser, type Env } from '../consts';

import { getCurrentBuildStats, readSizesFile, SIZES_FILE_PATH } from './utils';
import { type BundleSizes, type SizesFile, type TargetInfo } from './constants';

/**
 * Sort several fields of the bundle sizes stats alphabetically.
 *
 * @param stats Bundle sizes stats to sort.
 *
 * @returns Sorted bundle sizes stats.
 */
const sortStatsAlphabetically = (stats: BundleSizes): BundleSizes => {
    const sortKeys = (obj: Record<string, number>) => Object.fromEntries(
        Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
    );

    return {
        zip: stats.zip,
        files: sortKeys(stats.files),
        raw: stats.raw,
    };
};

/**
 * Write the sizes data to the sizes file.
 *
 * @param sizesData Data to write.
 */
const writeSizesFile = async (sizesData: SizesFile): Promise<void> => {
    try {
        await fs.promises.writeFile(SIZES_FILE_PATH, JSON.stringify(sizesData, null, 2));
    } catch (error) {
        throw new Error(`Failed to write sizes file: ${error}`);
    }
};

/**
 * Save the build statistics to the sizes file.
 *
 * @param buildType Build environment.
 * @param target Browser target.
 * @param currentStats Current build stats. Keys of every nested object
 * in the `stats` field will be sorted alphabetically to ensure consistent order.
 */
export async function saveBuildStats(
    buildType: Env,
    target: Browser,
    currentStats: TargetInfo,
): Promise<void> {
    // Read the existing sizes file
    const sizesData = await readSizesFile();

    // Update the sizes data with the new statistics
    // Use type assertion for buildType as key to address TypeScript indexing issue
    if (!sizesData[buildType]) {
        // @ts-expect-error TS2739: Type '{}' is missing the following properties from type browser.
        sizesData[buildType] = {};
    }

    // Update the target information
    // Use type assertion for proper indexing
    sizesData[buildType][target] = {
        version: currentStats.version,
        updatedAt: currentStats.updatedAt,
        // This is not strictly guaranteed that orders of fields will be
        // consistent during serialization, but for most modern environments,
        // the order we define in the object literal (as in the return value of
        // sortStatsAlphabetically) will be preserved when serializing with
        // JSON.stringify.
        stats: sortStatsAlphabetically(currentStats.stats),
    };

    // Write the updated sizes data back to the file
    await writeSizesFile(sizesData);
}

/**
 * Main function to update a specific bundle size record.
 *
 * Requires buildEnv and targetBrowser arguments to be set.
 * Updates the .bundle-sizes.json file with the latest build stats for the given target.
 * Throws if invalid build type or target is provided.
 *
 * @param buildEnv The build environment.
 * @param targetBrowser The target browser. Optional, defaults to all browsers.
 */
export async function updateBundleSize(buildEnv: Env, targetBrowser?: Browser): Promise<void> {
    const targets = targetBrowser
        ? [targetBrowser]
        : Object.values(Browser);

    for (let i = 0; i < targets.length; i += 1) {
        const target = targets[i];

        const envTargetMsgChunk = `for env "${buildEnv}" and target "${target}"`;

        console.log(`\n\nUpdating bundle size ${envTargetMsgChunk}...`);

        try {
            // Get current build stats
            // eslint-disable-next-line no-await-in-loop
            const currentStats = await getCurrentBuildStats(buildEnv, target);

            // Update the sizes file
            // eslint-disable-next-line no-await-in-loop
            await saveBuildStats(buildEnv, target, currentStats);

            console.log(`Bundle size update completed successfully ${envTargetMsgChunk}\n`);
        } catch (error) {
            throw new Error(`Error updating bundle size ${envTargetMsgChunk}: ${error}\n`);
        }
    }
}
