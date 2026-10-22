import { describe, expect, it } from 'vitest';

import { formatBuildVersion, formatCore, parseReleaseVersion } from '../../../tasks/release/version';

describe('parseReleaseVersion', () => {
    it('parses a release version', () => {
        expect(parseReleaseVersion('2.12.0')).toEqual({
            major: 2,
            minor: 12,
            patch: 0,
            beta: null,
            channel: 'release',
        });
    });

    it('parses a beta version with the v prefix', () => {
        expect(parseReleaseVersion('v2.12.0-beta.3')).toEqual({
            major: 2,
            minor: 12,
            patch: 0,
            beta: 3,
            channel: 'beta',
        });
    });

    it('parses a beta version without the v prefix', () => {
        expect(parseReleaseVersion('2.12.0-beta.1').beta).toBe(1);
        expect(parseReleaseVersion('2.12.0-beta.1').channel).toBe('beta');
    });

    it('rejects a four-component version', () => {
        expect(() => parseReleaseVersion('2.12.0.1')).toThrow(/Invalid release version/);
    });

    it('rejects an unsupported channel', () => {
        expect(() => parseReleaseVersion('2.12.0-rc.1')).toThrow(/Invalid release version/);
    });

    it('rejects an empty input', () => {
        expect(() => parseReleaseVersion('')).toThrow(/Invalid release version/);
    });
});

describe('formatBuildVersion', () => {
    it('keeps the beta number', () => {
        expect(formatBuildVersion(parseReleaseVersion('2.12.0-beta.2'), 2)).toBe('2.12.0.2');
    });

    it('formats the release build', () => {
        expect(formatBuildVersion(parseReleaseVersion('2.12.0'), 1)).toBe('2.12.0.1');
    });
});

describe('formatCore', () => {
    it('drops the beta suffix', () => {
        expect(formatCore(parseReleaseVersion('2.12.3-beta.4'))).toBe('2.12.3');
    });
});
