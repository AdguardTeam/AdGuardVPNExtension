import React, {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { AnimationType, APPEARANCE_THEMES, videoSourcesMap } from '../../../../lib/constants';

export const BackgroundVideo = observer(({ exclusionsScreen }: { exclusionsScreen?: boolean }) => {
    const { settingsStore } = useContext(rootStore);

    const {
        isConnected,
        appearanceTheme,
        animationType,
        setAnimationType,
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

    let backgroundVideoUrl = isConnected
        ? videoSources.connected
        : videoSources.disconnected;

    if (exclusionsScreen) {
        backgroundVideoUrl = videoSources.disconnected;
    }

    const animationUrl = animationType === AnimationType.SwitchOn
        ? videoSources[AnimationType.SwitchOn]
        : videoSources[AnimationType.SwitchOff];

    const handleAnimationEnded = (): void => {
        if (animationType) {
            setAnimationType(null);
        }
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const sourceUrl = animationType ? animationUrl : backgroundVideoUrl;

    useEffect(() => {
        videoRef.current?.load();
    });

    return (
        <video
            ref={videoRef}
            className="settings__video"
            autoPlay
            loop={!animationType}
            onEnded={handleAnimationEnded}
        >
            <source src={sourceUrl} type="video/webm" />
            <track kind="captions" />
        </video>
    );
});
