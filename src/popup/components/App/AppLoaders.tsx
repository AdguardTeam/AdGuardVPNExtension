import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { DotsLoader } from '../../../common/components/DotsLoader';
import { SkeletonLoading } from '../SkeletonLoading';

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
