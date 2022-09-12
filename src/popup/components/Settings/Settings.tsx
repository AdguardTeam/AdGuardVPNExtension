import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../stores';
import GlobalControl from './GlobalControl';
import { Status } from './Status';
import { APPEARANCE_THEMES, AnimationType, videoSourcesMap } from '../../../lib/constants';
import { BackgroundVideo } from './BackgroundVideo';

import './settings.pcss';

export const Settings = observer(() => {
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
        ? videoSourcesMap[systemTheme]
        : videoSourcesMap[appearanceTheme];

    const backgroundVideoUrl = isConnected
        ? videoSources.connected
        : videoSources.disconnected;

    const animationUrl = animationType === AnimationType.SwitchOn
        ? videoSources[AnimationType.SwitchOn]
        : videoSources[AnimationType.SwitchOff];

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
            <div className="settings__video-overlay" />
            <div className="settings__main">
                <Status />
                <GlobalControl />
            </div>
        </div>
    );
});
