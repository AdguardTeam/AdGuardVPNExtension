/**
 * @file Bundle size checker script
 * Tracks and compares bundle sizes across builds to detect significant size increases.
 *
 * Functionality:
 * - Compares current build sizes to reference sizes for each build type and browser target.
 * - Detects significant increases using configurable thresholds.
 * - Checks for duplicate package versions using pnpm.
 * - Stores historical size data in .bundle-sizes.json.
 * - Designed for CI/CD integration.
 */
import util from 'node:util';
import { exec } from 'node:child_process';
import path from 'node:path';

import { Browser, BUILD_DIR, Env } from '../consts';
import { getBrowserConf } from '../helpers';

import type {
    BundleSizes,
    CheckBundleSizesParams,
    Dependency,
    TargetInfo,
} from './constants';
import { MAX_FIREFOX_SIZE_BYTES, MAX_FIREFOX_AMO_SIZE_BYTES } from './constants';
import {
    getCurrentBuildStats,
    readSizesFile,
    formatPercentage,
    formatSize,
    getFilesWithSizes,
    getZipArchiveName,
} from './utils';
/* eslint-disable no-console */

const execAsync = util.promisify(exec);

/**
 * Pure function to determine if there are duplicate versions in the pnpm why output.
 *
 * @param pkgName Name of the package.
 * @param whyOutput Output string from `pnpm why <pkgName>`.
 *
 * @returns Object containing unique versions and relevant output with devDependencies removed.
 */
function countUniqueVersions(pkgName: string, whyOutput: string): {
    uniqueVersions: Set<string>;
    relevantOutput: string;
} {
    // Ignore version from devDependencies
    const devDependenciesIndex = whyOutput.indexOf('devDependencies:');
    const relevantOutput = whyOutput.slice(0, devDependenciesIndex !== -1 ? devDependenciesIndex : undefined);

    // Check if there are multiple versions
    const escapedPkgName = pkgName.replaceAll('/', '\\/');
    const packageNameAsRegex = new RegExp(`^.*\\s${escapedPkgName}\\s(.*)$`, 'gm');
    const instanceMatches = relevantOutput.matchAll(packageNameAsRegex);

    const packageAllVersions = Array.from(instanceMatches)
        .map((match) => match[1]?.replace(' peer', ''))
        .filter((version) => version !== undefined);

    const uniqueVersions = new Set(packageAllVersions);

    return {
        uniqueVersions,
        relevantOutput,
    };
}

/**
 * Wrapper to fetch pnpm why outputs and check for duplicates (side effects isolated here).
 *
 * @param dependencies List of dependency objects from pnpm why.
 *
 * @returns True if duplicates found, else false.
 */
async function processDependencies(dependencies: Dependency[]): Promise<boolean> {
    const dependencyNames = dependencies
        .map((pkg) => Object.keys(pkg)[0])
        .filter((pkgName) => pkgName !== undefined);

    const packagesWithReason = await Promise.all(dependencyNames.map(async (pkgName) => {
        const { stdout } = await execAsync(`pnpm why ${pkgName}`);

        return {
            pkgName,
            versions: stdout,
        };
    }));

    let hasDuplicates = false;

    // Don't use .some to list all packages with duplicates inside one call to script.
    packagesWithReason.forEach(({ pkgName, versions }) => {
        const { uniqueVersions, relevantOutput } = countUniqueVersions(pkgName, versions);

        if (uniqueVersions.size === 1) {
            return;
        }

        hasDuplicates = true;

        console.error(`\n❌ Multiple versions of ${pkgName} found:`, uniqueVersions.size);
        console.error(Array.from(uniqueVersions).map((version) => `- ${version}`).join('\n'));
        console.error(`\nInstalled version:\n${relevantOutput}`);
    });

    return hasDuplicates;
}

/**
 * Check for duplicate package versions using pnpm.
 *
 * @returns True if duplicates found or if failed to check, else false.
 */
async function checkForDuplicatePackages(): Promise<boolean> {
    try {
        console.log('\nChecking for duplicate package versions...');

        // Run pnpm list command to get dependency tree
        const { stdout } = await execAsync('pnpm list --json');

        // Parse JSON response
        const [result] = JSON.parse(stdout);

        if (!result.dependencies) {
            throw new Error('Invalid output from pnpm why command');
        }

        const dependenciesAsArr = Object.entries(result.dependencies)
            .map(([key, value]) => ({ [key]: value }));

        const hasDuplicates = await processDependencies(dependenciesAsArr);

        if (!hasDuplicates) {
            console.log('✅ No duplicate package versions found!\n');
        }

        return hasDuplicates;
    } catch (error) {
        console.error(`Error checking for duplicate packages: ${error}`);
        return true;
    }
}

/**
 * Compare current build sizes with reference sizes.
 *
 * @param current Current build stats.
 * @param reference Reference build stats.
 * @param buildType Build env prod, dev or beta
 * @param target Browser target.
 * @param threshold Allowed percentage increase.
 *
 * @returns True if issues found, else false.
 */
function compareBuildSizes(
    current: TargetInfo,
    reference: TargetInfo,
    buildType: Env,
    target: Browser,
    threshold: number,
): boolean {
    console.log('Size comparison results:\n');
    let hasIssues = false;

    // Compare zip files
    console.log('\nZIP File:\n');
    const newSize = current.stats.zip;
    const oldSize = reference.stats.zip;
    const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

    const zipArchiveName = getZipArchiveName(target, buildType);

    if (oldSize > 0 && changePercent > threshold) {
        hasIssues = true;
        console.error(`- ❌ ${zipArchiveName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatPercentage(oldSize, newSize)}) - Exceeds ${threshold}% threshold!`);
    } else {
        console.log(`- ✅ ${zipArchiveName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatPercentage(oldSize, newSize)})` : '(new file)'}`);
    }

    console.log('\nFiles:\n');
    Object.entries(current.stats.files).forEach(([fileName, newSize]) => {
        const oldSize = reference.stats.files[fileName] || 0;
        const changePercent = oldSize > 0 ? ((newSize - oldSize) / oldSize) * 100 : 0;

        if (oldSize > 0 && changePercent > threshold) {
            hasIssues = true;
            console.error(`- ❌ ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} (${formatPercentage(oldSize, newSize)}) - Exceeds ${threshold}% threshold!`);
        } else {
            console.log(`- ✅ ${fileName}: ${formatSize(oldSize)} → ${formatSize(newSize)} ${oldSize > 0 ? `(${formatPercentage(oldSize, newSize)})` : '(new file)'}`);
        }
    });

    return hasIssues;
}

/**
 * Check the size of the Firefox unpacked directory.
 *
 * @param buildType Build environment — beta or release.
 *
 * @param prevStats
 * @param threshold
 * @returns True if new size exceeds the limit
 * or if new size is more than threshold compared to previous size,
 * otherwise false.
 */
async function checkFirefoxUnpackedSize(
    buildType: Env,
    prevStats: BundleSizes,
    threshold: number,
): Promise<boolean> {
    if (buildType !== Env.Beta && buildType !== Env.Release) {
        throw new Error('Invalid build type for Firefox AMO unpacked size check, expected beta or release');
    }

    console.log('\n\nChecking Firefox AMO unpacked size...');

    try {
        // Get current build stats for this target
        const currentStats = await getCurrentBuildStats(buildType, Browser.Firefox);

        const currentSize = currentStats.stats.raw;
        if (!currentSize) {
            console.error('No current size found for Firefox AMO unpacked size check!');
            return true;
        }

        const rawDirName = `${getBrowserConf(Browser.Firefox).buildDir}`;

        if (currentSize > MAX_FIREFOX_AMO_SIZE_BYTES) {
            console.error(`${rawDirName}: ${(currentSize / (1024 * 1024)).toFixed(2)} MB - Exceeds maximum allowed size of ${MAX_FIREFOX_AMO_SIZE_BYTES} MB! ❌`);
            return true;
        }

        const prevSize = prevStats.raw;
        if (!prevSize) {
            console.error('No previous size found for Firefox AMO unpacked size check!');
            return true;
        }

        const changePercent = ((currentSize - prevSize) / prevSize) * 100;

        if (prevSize > 0 && changePercent > threshold) {
            console.error(`❌ ${rawDirName}: ${formatSize(prevSize)} → ${formatSize(currentSize)} (${formatPercentage(prevSize, currentSize)}) - Exceeds ${threshold}% threshold!`);
            return true;
        }

        console.log(`✅ ${rawDirName}: ${formatSize(prevSize)} → ${formatSize(currentSize)} (${formatPercentage(prevSize, currentSize)}) - ok!`);

        return false;
    } catch (e) {
        console.error(`Error checking Firefox AMO unpacked size: ${e}`);

        return true;
    }
}

/**
 * Checks that no .js, .css, .json file in Firefox builds exceeds 4MB (Firefox Add-ons Store limit).
 * Logs errors and returns true if any offending files are found.
 *
 * @param buildType Build environment (beta, release, etc.).
 *
 * @returns True if some files exceed 4MB, else false.
 */
async function checkFirefoxJsFileSizes(buildType: Env): Promise<boolean> {
    console.log('\n\nChecking Firefox Add-ons Store file sizes (.js, .css, .json)...');

    try {
        const dir = path.join(
            BUILD_DIR,
            buildType,
            getBrowserConf(Browser.Firefox).buildDir,
        );

        const allFiles = await getFilesWithSizes(dir);
        const fileChecks = Object.entries(allFiles)
            .filter(([file]) => file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.json'))
            .map(([file, size]) => ({ file, size }));

        let found = false;
        const bytesToMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(2);

        fileChecks.forEach(({ file, size }) => {
            if (size > MAX_FIREFOX_SIZE_BYTES) {
                found = true;
                console.error(`Firefox Add-ons Store limit exceeded: ${file} is ${bytesToMB(size)}MB (> ${bytesToMB(MAX_FIREFOX_SIZE_BYTES)}MB) ❌`);
            }
        });

        if (found) {
            console.error('❌ Some file sizes for Firefox Add-ons Store exceed the limit!');
        } else {
            console.log('✅ All file sizes for Firefox Add-ons Store are ok!');
        }

        return found;
    } catch (error) {
        console.error(`Error checking Firefox file sizes: ${error}`);
        return false;
    }
}

/**
 * Main function to check bundle sizes.
 *
 * @param data Check bundle sizes parameters.
 * @param data.buildEnv The build environment.
 * @param data.targetBrowser The target browser. Optional, defaults to all browsers in release and dev,
 * in beta all browsers except firefox.
 * @param data.threshold The threshold for bundle size comparison.
 *
 * @throws Error if any size or duplicate issues are detected.
 */
export async function checkBundleSizes({
    buildEnv, targetBrowser, threshold,
}: CheckBundleSizesParams): Promise<void> {
    // Define all possible targets to check
    const targets = targetBrowser
        ? [targetBrowser]
        : Object.values(Browser)
            .filter((browser: Browser) => !(buildEnv === Env.Beta && browser === Browser.Firefox));
    const sizesData = await readSizesFile();
    let hasSizeIssues = false;

    // Use a for loop to ensure sequential logging.
    for (let i = 0; i < targets.length; i += 1) {
        const target = targets[i]!;

        console.log(`\n\nChecking target: ${target}`);

        try {
            // Get current build stats for this target
            // eslint-disable-next-line no-await-in-loop
            const currentStats = await getCurrentBuildStats(buildEnv, target);

            if (!sizesData[buildEnv] || !sizesData[buildEnv][target]) {
                throw new Error(`Reference Build size for env ${buildEnv} and target ${target} not found.`);
            }

            // Compare with reference sizes if available
            const hasBuildSizesIssue = compareBuildSizes(
                currentStats,
                sizesData[buildEnv][target],
                buildEnv,
                target,
                threshold,
            );

            hasSizeIssues = hasSizeIssues || hasBuildSizesIssue;
        } catch (error) {
            // In normal mode, rethrow the error
            throw new Error(`Error processing target ${target}: ${error}`);
        }
    }

    let hasFirefoxSizeIssues = false;
    let hasFirefoxJsIssues = false;
    if (
        targets.includes(Browser.Firefox)
        && (buildEnv === Env.Beta || buildEnv === Env.Release)
    ) {
        hasFirefoxSizeIssues = await checkFirefoxUnpackedSize(
            buildEnv,
            sizesData[buildEnv][Browser.Firefox].stats,
            threshold,
        );

        // Check for Firefox Add-ons Store file size limit (4MB per each file)
        hasFirefoxJsIssues = await checkFirefoxJsFileSizes(buildEnv);
    }

    // Check for duplicate packages (do this only once for all targets)
    const hasDuplicates = await checkForDuplicatePackages();

    // Exit with error if there are issues in any target
    if (
        hasSizeIssues
        || hasFirefoxSizeIssues
        || hasDuplicates
        || hasFirefoxJsIssues
    ) {
        throw new Error('Bundle size check failed due to size issues. Check the output above.');
    }

    // Exit with error if there are issues in any target
    if (hasDuplicates) {
        throw new Error('Bundle size check failed due to duplicate packages. Check the output above.');
    }

    console.log('Bundle size check completed successfully.');
}
