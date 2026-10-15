import { describe, it, expect } from 'vitest';

import {
    getProfileSubScreenOrigin,
    withProfileOrigin,
} from '../../../../src/options/components/Profiles/profileRoutes';

describe('profileRoutes origin helpers', () => {
    it('should add the origin to the sub-screen route', () => {
        expect(withProfileOrigin('/profiles/p1/dns', '/'))
            .toBe('/profiles/p1/dns?from=%2F');
        expect(withProfileOrigin('/profiles/p1/exclusions', '/profiles/p1'))
            .toBe('/profiles/p1/exclusions?from=%2Fprofiles%2Fp1');
    });

    it('should resolve the origin from the search string', () => {
        expect(getProfileSubScreenOrigin('?from=%2F', 'p1')).toBe('/');
        expect(getProfileSubScreenOrigin('?from=%2Fprofiles%2Fp1', 'p1')).toBe('/profiles/p1');
    });

    it('should round-trip the origin through the query parameter', () => {
        const route = withProfileOrigin('/profiles/p1/dns', '/profiles/p1?tab=2');
        const search = route.slice(route.indexOf('?'));

        expect(getProfileSubScreenOrigin(search, 'p1')).toBe('/profiles/p1?tab=2');
    });

    it('should fall back to the profile screen for unsafe origins', () => {
        expect(getProfileSubScreenOrigin('', 'p1')).toBe('/profiles/p1');
        expect(getProfileSubScreenOrigin('?foo=bar', 'p1')).toBe('/profiles/p1');
        // Empty value and a foreign path.
        expect(getProfileSubScreenOrigin('?from=', 'p1')).toBe('/profiles/p1');
        expect(getProfileSubScreenOrigin('?from=https%3A%2F%2Fevil.com', 'p1')).toBe('/profiles/p1');
    });

    it('should keep a literal percent sign in the origin', () => {
        // `URLSearchParams` decodes `%25` to `%`, which is a valid path character.
        expect(getProfileSubScreenOrigin('?from=%2F%25', 'p1')).toBe('/%');
    });
});
