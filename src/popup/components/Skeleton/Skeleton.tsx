import React, { useContext } from 'react';

import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { Icons } from '../ui/Icons';
import { BackgroundAnimation } from '../Settings/BackgroundAnimation';

import { SkeletonHeader } from './SkeletonHeader';
import { SkeletonEndpoint } from './SkeletonTest';

import '../Settings/GlobalControl/ExcludeSite/exclude-site.pcss';
import '../Settings/settings.pcss';
import './skeleton.pcss';

export const Skeleton = () => {
    const { settingsStore } = useContext(rootStore);

    return (
        <>
            <div>
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
                            className="button button--medium button--green button--green--inactive"
                        >
                            {reactTranslator.getMessage('settings_connect')}
                        </button>

                        {settingsStore.canBeExcluded
                            && (
                                <div className="exclude-site-wrapper">
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        className="button settings__exclusion-btn settings__exclusion-btn--inactive"
                                    >
                                        {reactTranslator.getMessage('popup_settings_disable_vpn')}
                                    </button>
                                </div>
                            )
                        }

                    </div>
                </div>

                <SkeletonEndpoint />
            </div>
            <Icons />
        </>
    );
};
