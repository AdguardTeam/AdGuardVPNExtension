import React, { useContext } from 'react';

import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { Icons } from '../../../common/components/Icons';
import { BackgroundAnimation } from '../Settings/BackgroundAnimation';
import { SkeletonHeader } from '../ui/SkeletonHeader';
import { SkeletonEndpoint } from '../ui/SkeletonEndpoint';

import '../Settings/GlobalControl/ExcludeSite/exclude-site.pcss';
import '../Settings/settings.pcss';

export const SkeletonLoading = () => {
    const { settingsStore } = useContext(rootStore);

    return (
        <>
            <SkeletonHeader />
            <div className="settings settings__skeleton">
                <BackgroundAnimation />
                <div className="settings__animation-overlay" />

                <div className="settings__main">
                    <div className="status status--skeleton">
                        {reactTranslator.getMessage('popup_skeleton_status')}
                    </div>

                    <button
                        type="button"
                        tabIndex={-1}
                        className="button button--medium button--green button--green--inactive button--main"
                    >
                        {reactTranslator.getMessage('settings_connect')}
                    </button>

                    {settingsStore.canBeExcluded && (
                        <div className="exclude-site-wrapper">
                            <button
                                type="button"
                                tabIndex={-1}
                                className="button settings__exclusion-btn settings__exclusion-btn--inactive"
                            >
                                {reactTranslator.getMessage('popup_settings_disable_vpn')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <SkeletonEndpoint />
            <Icons />
        </>
    );
};
