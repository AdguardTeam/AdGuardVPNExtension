import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockPush = vi.fn();

const mockHistory = { push: mockPush };

vi.mock('react-router-dom', () => ({
    useHistory: () => mockHistory,
}));

// eslint-disable-next-line import/first
import { useProfileRouteNavigation } from '../../../src/options/hooks/useProfileRouteNavigation';
// eslint-disable-next-line import/first
import {
    getProfileRoute,
    getProfileDnsRoute,
    getProfileLocationRoute,
    getProfileExclusionsRoute,
} from '../../../src/options/components/Profiles/profileRoutes';

describe('useProfileRouteNavigation', () => {
    beforeEach(() => {
        mockPush.mockClear();
    });

    it('should push the profile detail route on click', () => {
        const { result } = renderHook(() => useProfileRouteNavigation(getProfileRoute));

        act(() => {
            result.current('profile-1');
        });

        expect(mockPush).toHaveBeenCalledTimes(1);
        expect(mockPush).toHaveBeenCalledWith('/profiles/profile-1');
    });

    it('should push the profile DNS route on click', () => {
        const { result } = renderHook(() => useProfileRouteNavigation(getProfileDnsRoute));

        act(() => {
            result.current('profile-2');
        });

        expect(mockPush).toHaveBeenCalledWith('/profiles/profile-2/dns');
    });

    it('should push the profile location route on click', () => {
        const { result } = renderHook(() => useProfileRouteNavigation(getProfileLocationRoute));

        act(() => {
            result.current('profile-3');
        });

        expect(mockPush).toHaveBeenCalledWith('/profiles/profile-3/location');
    });

    it('should push the profile exclusions route on click', () => {
        const { result } = renderHook(() => useProfileRouteNavigation(getProfileExclusionsRoute));

        act(() => {
            result.current('profile-4');
        });

        expect(mockPush).toHaveBeenCalledWith('/profiles/profile-4/exclusions');
    });

    it('should handle arbitrary profile IDs', () => {
        const { result } = renderHook(() => useProfileRouteNavigation(getProfileRoute));

        act(() => {
            result.current('complex-id_123');
        });

        expect(mockPush).toHaveBeenCalledWith('/profiles/complex-id_123');
    });

    it('should return a stable callback identity', () => {
        const { result, rerender } = renderHook(() => useProfileRouteNavigation(getProfileRoute));

        const firstCallback = result.current;

        rerender();

        expect(result.current).toBe(firstCallback);
    });
});
