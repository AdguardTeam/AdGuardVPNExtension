import path from 'path';

import { WebpackError, type Compiler } from 'webpack';
import { filesize } from 'filesize';

/**
 * No size limit for file extension.
 */
export const NO_SIZE_LIMIT = 0;

/**
 * Convert megabytes to bytes.
 *
 * @param mb The size in megabytes.
 *
 * @returns The size in bytes.
 */
export const megabytesToBytes = (mb: number): number => mb * 1024 * 1024;

/**
 * Size limits for the different file extensions.
 */
type SizeLimits = {
    [key: string]: number;
};

/**
 * Problematic file with its name and size.
 */
type ProblematicFile = {
    /**
     * The name of the file.
     */
    filename: string;

    /**
     * The size of the file in bytes.
     */
    sizeInBytes: number;
};

/**
 * Webpack plugin to limit the size of the output files.
 */
export class SizeLimitPlugin {
    /**
     * Size limits for the different file extensions.
     */
    private limits: SizeLimits;

    /**
     * Creates an instance of SizeLimitPlugin.
     *
     * @param limits The size limits for the different file extensions. Limits are in bytes.
     */
    constructor(limits: SizeLimits) {
        this.limits = limits;
    }

    /**
     * Get the size limit for a file.
     *
     * @param filename The name of the file.
     *
     * @returns The size limit in MB or 0 if no limit is set.
     */
    private getLimitForFile(filename: string): number {
        const { ext } = path.parse(filename);
        return this.limits[ext] ?? NO_SIZE_LIMIT;
    }

    /**
     * Apply the plugin to the compiler.
     *
     * @param compiler The webpack compiler.
     */
    apply(compiler: Compiler) {
        compiler.hooks.emit.tapAsync('SizeLimitPlugin', (compilation, callback) => {
            const problematicFiles: ProblematicFile[] = [];

            // eslint-disable-next-line no-restricted-syntax
            for (const [filename, data] of Object.entries(compilation.assets)) {
                const limitInBytes = this.getLimitForFile(filename);
                if (limitInBytes !== NO_SIZE_LIMIT) {
                    const sizeInBytes = data.size();

                    if (sizeInBytes > limitInBytes) {
                        compilation.errors.push(
                            new WebpackError(
                                // eslint-disable-next-line max-len
                                `${filename}'s actual size (${filesize(sizeInBytes)}) exceeds the maximum size limit (${filesize(limitInBytes)})`,
                            ),
                        );
                        problematicFiles.push({ filename, sizeInBytes });
                    }
                }
            }

            if (problematicFiles.length) {
                const filesWithSizes = problematicFiles.map(({ filename, sizeInBytes }) => {
                    return `${filename} (${filesize(sizeInBytes)})`;
                });
                callback(new Error(`Size limit exceeded for the following files: ${filesWithSizes.join(', ')}`));
            } else {
                callback();
            }
        });
    }
}
