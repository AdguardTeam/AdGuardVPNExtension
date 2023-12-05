import React from 'react';

import { reactTranslator } from '../../../common/reactTranslator';
import { Icons } from '../ui/Icons';

import { SkeletonHeader } from './SkeletonHeader';
import { SkeletonEndpoint } from './SkeletonEndpoint';

import '../Settings/GlobalControl/ExcludeSite/exclude-site.pcss';
import '../Settings/settings.pcss';
import './skeleton.pcss';

export const Skeleton = () => {
    return (
        <>
            <div>
                <SkeletonHeader />

                <div className="settings settings__skeleton">
                    <div className="settings__skeleton--background" />
                    <div className="settings__main">
                        <div className="status status--skeleton">
                            {reactTranslator.getMessage('popup_skeleton_status')}
                        </div>

                        <button
                            type="button"
                            tabIndex={-1}
                            className="button button--medium button--green--inactive"
                        >
                            {reactTranslator.getMessage('settings_connect')}
                        </button>

                        <div className="exclude-site-wrapper">
                            <button
                                type="button"
                                tabIndex={-1}
                                className="button settings__exclusion-btn settings__exclusion-btn--inactive"
                            >
                                {reactTranslator.getMessage('popup_settings_disable_vpn')}
                            </button>
                        </div>
                    </div>
                </div>

                <SkeletonEndpoint />
            </div>
            <Icons />
        </>
    );
};
