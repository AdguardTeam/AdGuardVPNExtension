/**
 * Amount of bytes in a megabyte.
 */
const BYTES_IN_MB = 1024 * 1024;

/**
 * Amount of bytes in a gigabyte.
 */
const BYTES_IN_GB = 1024 * BYTES_IN_MB;

/**
 * Suffix for megabytes.
 */
const MB_SUFFIX = 'MB';

/**
 * Suffix for gigabytes.
 */
const GB_SUFFIX = 'GB';

/**
 * Download arrow character. Used as prefix for download bytes.
 */
const DOWNLOAD_PREFIX = '↓';

/**
 * Upload arrow character. Used as prefix for upload bytes.
 */
const UPLOAD_PREFIX = '↑';

/**
 * Formats the given number of bytes into a human-readable string (MB or GB).
 *
 * @param bytes The number of bytes to format.
 * @param includePrefixArrow Set to true if the prefix arrow should be included, false otherwise.
 * Use with `isDownload` parameter to determine the arrow direction.
 * @param isDownload Set to true if the bytes are download bytes, false if upload bytes.
 */
export function formatBytes(
    bytes: number,
    includePrefixArrow = false,
    isDownload = false,
): string {
    let result = '';
    if (bytes >= BYTES_IN_GB) {
        const gb = bytes / BYTES_IN_GB;
        result = `${gb.toFixed(1)} ${GB_SUFFIX}`;
    } else {
        const mb = Math.floor(bytes / BYTES_IN_MB);
        result = `${mb} ${MB_SUFFIX}`;
    }

    if (!includePrefixArrow) {
        return result;
    }

    return `${isDownload ? DOWNLOAD_PREFIX : UPLOAD_PREFIX} ${result}`;
}
