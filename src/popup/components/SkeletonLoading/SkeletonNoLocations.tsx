import React, { useContext } from 'react';

import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { Icons } from '../ui/Icons';

import { SkeletonHeader } from './SkeletonHeader';
import { SkeletonEndpoint } from './SkeletonEndpoint';

import '../Settings/GlobalControl/ExcludeSite/exclude-site.pcss';
import '../Settings/settings.pcss';
import './skeleton.pcss';

export const SkeletonNoLocations = () => {
    const { vpnStore } = useContext(rootStore);

    const handleSearchAgain = async (): Promise<void> => {
        await vpnStore.forceUpdateLocations();
    };

    return (
        <>
            <SkeletonHeader />
            <div className="skeleton__no-locations">
                <div className="skeleton__no-locations__background" />
                <div className="skeleton__no-locations__content">
                    <div className="skeleton__no-locations__img" />
                    <div className="status status--skeleton__no-locations">
                        {reactTranslator.getMessage('popup_no_locations_title')}
                    </div>
                    <button
                        type="button"
                        className="button button--medium skeleton__no-locations__btn"
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
