import React, { type ReactElement, useContext } from 'react';

import { reactTranslator } from '../../../common/reactTranslator';
import { isLocationsNumberAcceptable } from '../../../common/is-locations-number-acceptable';
import { rootStore } from '../../stores';
import { Icons } from '../../../common/components/Icons';
import { SkeletonHeader } from '../ui/SkeletonHeader';
import { SkeletonEndpoint } from '../ui/SkeletonEndpoint';

import './no-locations-error.pcss';

export const NoLocationsError = (): ReactElement => {
    const { vpnStore, settingsStore } = useContext(rootStore);

    const handleSearchAgain = async (): Promise<void> => {
        const locations = await vpnStore.forceUpdateLocations();
        await vpnStore.setLocations(locations);
        settingsStore.setIsVpnBlocked(isLocationsNumberAcceptable(locations));
    };

    return (
        <>
            <SkeletonHeader />
            <div className="no-locations-error">
                <div className="no-locations-error__background" />
                <div className="no-locations-error__content">
                    <div className="no-locations-error__img" />
                    <div className="status status--no-locations-error">
                        {reactTranslator.getMessage('popup_no_locations_title')}
                    </div>
                    <button
                        type="button"
                        className="button button--medium no-locations-error__btn"
                        onClick={handleSearchAgain}
                    >
                        {reactTranslator.getMessage('popup_no_locations_button')}
                    </button>
                </div>
            </div>
            <SkeletonEndpoint />
            <Icons />
        </>
    );
};
