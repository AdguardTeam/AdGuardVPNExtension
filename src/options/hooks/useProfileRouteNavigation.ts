import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

/**
 * Returns a click handler that navigates to a profile-specific route.
 *
 * @param getRoute Function that builds the route path from a profile ID.
 * @returns Click handler that pushes the route onto the history stack.
 */
export const useProfileRouteNavigation = (
    getRoute: (profileId: string) => string,
): ((profileId: string) => void) => {
    const history = useHistory();

    return useCallback((profileId: string): void => {
        history.push(getRoute(profileId));
    }, [history, getRoute]);
};
