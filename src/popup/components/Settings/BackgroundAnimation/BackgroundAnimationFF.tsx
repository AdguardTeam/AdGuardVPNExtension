import React, {
    useContext,
    useRef,
    useEffect,
    useMemo,
} from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { AppearanceTheme } from '../../../../common/constants';
import { AnimationState, animationSourcesMap } from '../../../constants';

import { animationService } from './animationStateMachine';

type VideoRefs = {
    [key: string]: HTMLVideoElement | null;
};

/**
 * Background animation component for Firefox Android.
 *
 * Uses HTML video elements controlled by the animation state machine.
 * Videos are preloaded and switched based on the current animation state.
 *
 * Default canvas implementation not used in firefox because of the issue
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1526207
 */
export const BackgroundAnimationFF = React.memo(observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        appearanceTheme,
        systemTheme,
        animationState,
    } = settingsStore;

    const videoRefs = useRef<VideoRefs>({});

    const themeToUse = useMemo(() => {
        if (
            appearanceTheme === AppearanceTheme.Light
            || appearanceTheme === AppearanceTheme.Dark
        ) {
            return appearanceTheme;
        }
        return systemTheme;
    }, [appearanceTheme, systemTheme]);

    const animationSources = useMemo(() => animationSourcesMap[themeToUse], [themeToUse]);

    const handleAnimationEnd = (): void => {
        settingsStore.handleAnimationEnd();
    };

    useEffect(() => {
        animationService.onTransition((state) => {
            settingsStore.setAnimationState(state.value as AnimationState);
        });

        return (): void => {
            // Finish in-progress transition to prevent animation restart
            settingsStore.handleAnimationEnd();
        };
    }, [settingsStore]);

    // Play/pause videos when animation state changes
    useEffect(() => {
        const currentVideo = videoRefs.current[animationState];
        if (currentVideo) {
            currentVideo.currentTime = 0;
            currentVideo.play();
        }

        Object.entries(videoRefs.current).forEach(([state, video]) => {
            if (video && state !== animationState) {
                video.pause();
            }
        });
    }, [animationState]);

    return (
        <div className="settings__animation">
            {Object.entries(animationSources).map(([state, url]) => {
                const isActive = state === animationState;
                const shouldLoop = state === AnimationState.VpnEnabled || state === AnimationState.VpnDisabled;

                return (
                    <video
                        key={state}
                        ref={(el): void => { videoRefs.current[state] = el; }}
                        src={url}
                        muted
                        playsInline
                        preload="auto"
                        loop={shouldLoop}
                        onEnded={!shouldLoop ? handleAnimationEnd : undefined}
                        className="background-animation-video"
                        style={{
                            display: isActive ? 'block' : 'none',
                        }}
                        aria-hidden="true"
                    />
                );
            })}
        </div>
    );
}));
