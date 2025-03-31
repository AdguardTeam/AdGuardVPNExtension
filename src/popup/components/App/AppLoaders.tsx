import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { SkeletonLoading } from '../SkeletonLoading';

/**
 * App level loaders component.
 *
 * It shows dots loader when user is not authenticated or onboarding should be rendered,
 * otherwise it shows skeleton loading. It is more reliable to show a separate skeleton
 * component instead of changing different components based on the initStatus.
 * Because it would be more difficult to check all components and make sure that
 * they do not require any data fetching.
 */
export const AppLoaders = observer(() => {
    const { authStore } = useContext(rootStore);

    const {
        authenticatedStatusRetrieved,
        authenticated,
        renderOnboarding,
    } = authStore;

    // Do not show loaders until authenticated status is retrieved
    if (!authenticatedStatusRetrieved) {
        return null;
    }

    /**
     * Dots loader should be shown:
     * - if user is not authenticated
     * - if user is authenticated and onboarding should be rendered
     */
    if (!authenticated || renderOnboarding) {
        return (
            <div className="data-loader">
                <DotsLoader />
            </div>
        );
    }

    return (
        <SkeletonLoading />
    );
});
