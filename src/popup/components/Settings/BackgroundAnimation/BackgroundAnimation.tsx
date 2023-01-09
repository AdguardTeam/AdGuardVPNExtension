import React, { useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import {
    AnimationState,
    APPEARANCE_THEMES,
    animationSourcesMap,
} from '../../../../lib/constants';
import { animationService } from './animationStateMachine';

interface BackgroundAnimationProps {
    exclusionsScreen?: boolean;
}

export const BackgroundAnimation = observer(({ exclusionsScreen }: BackgroundAnimationProps) => {
    const { settingsStore } = useContext(rootStore);

    const {
        appearanceTheme,
        systemTheme,
        animationState,
    } = settingsStore;

    useEffect(() => {
        animationService.onTransition((state) => {
            settingsStore.setAnimationState(state.value);
        });
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    let animationSources = animationSourcesMap[systemTheme];

    if (appearanceTheme && appearanceTheme !== APPEARANCE_THEMES.SYSTEM) {
        animationSources = animationSourcesMap[appearanceTheme];
    }

    // it is not complex state node,
    // for a child atomic state node animationState is a string
    let sourceUrl = animationSources[animationState as string];

    if (exclusionsScreen) {
        sourceUrl = animationSources[AnimationState.VpnDisabled];
    }

    const loop = animationState === AnimationState.VpnEnabled
        || animationState === AnimationState.VpnDisabled;

    const handleAnimationEnd = () => {
        settingsStore.handleAnimationEnd();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!context || !canvas) {
            return undefined;
        }

        const updateCanvas = (video: HTMLVideoElement) => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(() => updateCanvas(video));
        };

        const video = document.createElement('video');
        video.src = sourceUrl;
        video.loop = loop;
        video.autoplay = true;
        video.addEventListener('ended', handleAnimationEnd);

        const loadedDataHandler = async () => {
            await video.play();
            updateCanvas(video);
        };
        video.addEventListener('loadeddata', loadedDataHandler);

        return () => {
            video.removeEventListener('loadeddata', loadedDataHandler);
            video.removeEventListener('ended', handleAnimationEnd);
        };
    }, [sourceUrl, loop]);

    return (
        <canvas ref={canvasRef} className="settings__animation">
            Background animation
        </canvas>
    );
});
