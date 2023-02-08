import React, { useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import {
    AnimationState,
    AppearanceTheme,
    animationSourcesMap,
} from '../../../../lib/constants';
import { animationService } from './animationStateMachine';

export const BackgroundAnimation = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        appearanceTheme,
        systemTheme,
        animationState,
    } = settingsStore;

    useEffect(() => {
        animationService.onTransition((state) => {
            // new state value on transition is string, but it's actually AnimationState
            settingsStore.setAnimationState(state.value as AnimationState);
        });
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    let animationSources = animationSourcesMap[systemTheme];

    if (appearanceTheme && appearanceTheme !== AppearanceTheme.System) {
        animationSources = animationSourcesMap[appearanceTheme];
    }

    const sourceUrl = animationSources[animationState];

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
