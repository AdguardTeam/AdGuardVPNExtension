import React, {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import {
    Animation,
    APPEARANCE_THEMES,
    videoSourcesMap,
    videoPostersMap,
} from '../../../../lib/constants';

interface BackgroundVideoProps {
    exclusionsScreen?: boolean;
}

export const BackgroundVideo = observer(({ exclusionsScreen }: BackgroundVideoProps) => {
    const { settingsStore } = useContext(rootStore);

    const {
        isConnected,
        appearanceTheme,
        animation,
        setAnimation,
    } = settingsStore;

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

    const videoPosters = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? videoPostersMap[systemTheme]
        : videoPostersMap[appearanceTheme];

    let backgroundVideoUrl = isConnected
        ? videoSources[Animation.Connected]
        : videoSources[Animation.Disconnected];

    let backgroundVideoPoster = isConnected
        ? videoPosters[Animation.Connected]
        : videoPosters[Animation.Disconnected];

    if (exclusionsScreen) {
        backgroundVideoUrl = videoSources[Animation.Disconnected];
        backgroundVideoPoster = videoPosters[Animation.Disconnected];
    }

    const animationUrl = animation === Animation.SwitchOn
        ? videoSources[Animation.SwitchOn]
        : videoSources[Animation.SwitchOff];

    const animationPoster = animation === Animation.SwitchOn
        ? videoPosters[Animation.SwitchOn]
        : videoPosters[Animation.SwitchOff];

    const handleAnimationEnded = (): void => {
        if (animation) {
            setAnimation(null);
        }
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const sourceUrl = animation ? animationUrl : backgroundVideoUrl;
    const poster = animation ? animationPoster : backgroundVideoPoster;

    useEffect(() => {
        videoRef.current?.load();
    });

    return (
        <video
            ref={videoRef}
            className="settings__video"
            autoPlay
            loop={!animation}
            onEnded={handleAnimationEnded}
            poster={poster}
        >
            <source src={sourceUrl} type="video/webm" />
            <track kind="captions" />
        </video>
    );
});
