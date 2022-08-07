import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../stores';
import GlobalControl from './GlobalControl';
import Status from './Status';
import { APPEARANCE_THEMES } from '../../../lib/constants';
import { BackgroundVideo } from './BackgroundVideo';

import './settings.pcss';

const MOTION_FOLDER_PATH = '../../../assets/motion/';

const Settings = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const {
        isConnected,
        appearanceTheme,
        animation,
        stopAnimation,
    } = settingsStore;

    const {
        premiumPromoEnabled,
        isPremiumToken,
    } = vpnStore;

    const settingsClass = classnames(
        'settings',
        { 'settings--active': isConnected },
        { 'settings--premium-promo': premiumPromoEnabled },
        { 'settings--trial': !isPremiumToken },
        { 'settings--feedback': !premiumPromoEnabled },
    );

    const sourcesMap = {
        [APPEARANCE_THEMES.LIGHT]: {
            connected: `${MOTION_FOLDER_PATH}on-day.webm`,
            connecting: `${MOTION_FOLDER_PATH}switch-on-day.webm`,
            disconnected: `${MOTION_FOLDER_PATH}off-day.webm`,
            disconnecting: `${MOTION_FOLDER_PATH}switch-off-day.webm`,
        },
        [APPEARANCE_THEMES.DARK]: {
            connected: `${MOTION_FOLDER_PATH}on-night.webm`,
            connecting: `${MOTION_FOLDER_PATH}switch-on-night.webm`,
            disconnected: `${MOTION_FOLDER_PATH}off-night.webm`,
            disconnecting: `${MOTION_FOLDER_PATH}switch-off-night.webm`,
        },
    };

    const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? APPEARANCE_THEMES.DARK
        : APPEARANCE_THEMES.LIGHT;

    const videoSources = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? sourcesMap[systemTheme]
        : sourcesMap[appearanceTheme];

    const videoUrl = isConnected ? videoSources.connected : videoSources.disconnected;

    const introUrl = animation === 'connected' ? videoSources.connecting : videoSources.disconnecting;

    const handleIntroEnd = (): void => {
        stopAnimation();
    };

    return (
        <div className={settingsClass}>
            <BackgroundVideo videoUrl={videoUrl} />
            <BackgroundVideo
                videoUrl={introUrl}
                visible={!!animation}
                loop={false}
                onEndedHandler={handleIntroEnd}
            />
            <div className="settings__main">
                <Status />
                <GlobalControl />
            </div>
        </div>
    );
});

export { Settings };
