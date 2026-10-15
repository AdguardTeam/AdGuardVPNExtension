import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Message-key guard.
 *
 * `TranslationService.getMessage` throws for keys missing from the base locale,
 * and unit tests mock the translator, so a missing key only shows up at runtime
 * (the user sees an internal error instead of the message). This test checks
 * every literal key used in `src` against `src/_locales/en/messages.json`.
 */

const SRC_DIR = path.resolve(__dirname, '../../../src');
const BASE_LOCALE_PATH = path.resolve(SRC_DIR, '_locales/en/messages.json');

/** Source file extensions that can contain message keys. */
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

/**
 * Collects source files recursively.
 *
 * @param dirPath Directory to scan.
 * @returns File paths.
 */
function collectSourceFiles(dirPath: string): string[] {
    return readdirSync(dirPath).flatMap((file) => {
        const fullPath = path.join(dirPath, file);

        if (statSync(fullPath).isDirectory()) {
            return collectSourceFiles(fullPath);
        }

        return SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension))
            ? [fullPath]
            : [];
    });
}

/**
 * Returns the message keys used with a literal argument in the given source.
 * Comment lines are skipped: keys are mentioned in comments as well.
 *
 * @param source Source file contents.
 * @returns Message keys.
 */
function collectMessageKeys(source: string): string[] {
    return source.split('\n').flatMap((line) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
            return [];
        }

        return Array.from(line.matchAll(/get(?:Message|Plural)\(\s*'([^']+)'/g), (match) => match[1]);
    });
}

describe('message keys', () => {
    it('should exist in the base locale', () => {
        const baseMessages = JSON.parse(readFileSync(BASE_LOCALE_PATH, 'utf8')) as Record<string, unknown>;

        const missing = collectSourceFiles(SRC_DIR).flatMap((file) => {
            return collectMessageKeys(readFileSync(file, 'utf8'))
                .filter((key) => !(key in baseMessages))
                .map((key) => `${key} (${path.relative(SRC_DIR, file)})`);
        });

        expect(missing).toEqual([]);
    });
});
