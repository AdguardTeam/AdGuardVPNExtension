import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../stores';
import GlobalControl from './GlobalControl';
import Status from './Status';
import { APPEARANCE_THEMES, ANIMATION_TYPES } from '../../../lib/constants';
import { BackgroundVideo } from './BackgroundVideo';

import './settings.pcss';

const MOTION_FOLDER_PATH = '../../../assets/motion/';

const Settings = observer(() => {
    const { settingsStore, vpnStore } = useContext(rootStore);

    const {
        isConnected,
        appearanceTheme,
        animationType,
        setAnimation,
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
            disconnected: `${MOTION_FOLDER_PATH}off-day.webm`,
            [ANIMATION_TYPES.SWITCH_ON]: `${MOTION_FOLDER_PATH}switch-on-day.webm`,
            [ANIMATION_TYPES.SWITCH_OFF]: `${MOTION_FOLDER_PATH}switch-off-day.webm`,
        },
        [APPEARANCE_THEMES.DARK]: {
            connected: `${MOTION_FOLDER_PATH}on-night.webm`,
            disconnected: `${MOTION_FOLDER_PATH}off-night.webm`,
            [ANIMATION_TYPES.SWITCH_ON]: `${MOTION_FOLDER_PATH}switch-on-night.webm`,
            [ANIMATION_TYPES.SWITCH_OFF]: `${MOTION_FOLDER_PATH}switch-off-night.webm`,
        },
    };

    const darkThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = darkThemeMediaQuery.matches
        ? APPEARANCE_THEMES.DARK
        : APPEARANCE_THEMES.LIGHT;

    const [systemTheme, setSystemTheme] = useState(currentTheme);

    const systemThemeChangeHandler = ((e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? APPEARANCE_THEMES.DARK : APPEARANCE_THEMES.LIGHT);
    });

    useEffect(() => {
        darkThemeMediaQuery.addEventListener('change', systemThemeChangeHandler);
        return () => darkThemeMediaQuery.removeEventListener('change', systemThemeChangeHandler);
    }, []);

    const videoSources = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? sourcesMap[systemTheme]
        : sourcesMap[appearanceTheme];

    const backgroundVideoUrl = isConnected
        ? videoSources.connected
        : videoSources.disconnected;

    const animationUrl = animationType === ANIMATION_TYPES.SWITCH_ON
        ? videoSources[ANIMATION_TYPES.SWITCH_ON]
        : videoSources[ANIMATION_TYPES.SWITCH_OFF];

    const handleAnimationEnded = (): void => {
        setAnimation(null);
    };

    return (
        <div className={settingsClass}>
            <BackgroundVideo videoUrl={backgroundVideoUrl} />
            <BackgroundVideo
                videoUrl={animationUrl}
                visible={!!animationType}
                loop={false}
                onEndedHandler={handleAnimationEnded}
            />
            <div className="settings__main">
                <Status />
                <GlobalControl />
            </div>
        </div>
    );
});

export { Settings };
