import React, { useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import {
    AnimationState,
    APPEARANCE_THEMES,
    animationSourcesMap,
} from '../../../../lib/constants';

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

    const canvasRef = useRef<HTMLCanvasElement>(null);

    let animationSources = animationSourcesMap[systemTheme];

    if (appearanceTheme && appearanceTheme !== APPEARANCE_THEMES.SYSTEM) {
        animationSources = animationSourcesMap[appearanceTheme];
    }

    let sourceUrl = animationSources[animationState as AnimationState];

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
            return;
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
        video.onended = handleAnimationEnd;
        video.addEventListener('loadeddata', async () => {
            await video.play();
            updateCanvas(video);
        });
    });

    return (
        <canvas ref={canvasRef} className="settings__animation">
            Background animation
        </canvas>
    );
});
