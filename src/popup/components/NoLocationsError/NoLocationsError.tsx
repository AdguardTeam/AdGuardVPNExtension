import React, { useContext } from 'react';

import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { Icons } from '../ui/Icons';
import { SkeletonHeader } from '../ui/SkeletonHeader';
import { SkeletonFooter } from '../ui/SkeletonFooter';

import './no-locations-error.pcss';

export const NoLocationsError = () => {
    const { vpnStore } = useContext(rootStore);

    const handleSearchAgain = async (): Promise<void> => {
        await vpnStore.forceUpdateLocations();
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
            <SkeletonFooter />
            <Icons />
        </>
    );
};
