import React, { useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { AppearanceTheme } from '../../../../common/constants';
import { AnimationState, animationSourcesMap } from '../../../constants';

import { animationService } from './animationStateMachine';

export const BackgroundAnimation = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const {
        appearanceTheme,
        systemTheme,
        animationState,
    } = settingsStore;

    const animationStateToUse = animationState;

    useEffect(() => {
        animationService.onTransition((state) => {
            // new state value on transition is string, but it's actually AnimationState
            settingsStore.setAnimationState(state.value as AnimationState);
        });
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    let animationSources = animationSourcesMap[systemTheme];

    if (appearanceTheme
        && (appearanceTheme === AppearanceTheme.Light
            || appearanceTheme === AppearanceTheme.Dark)) {
        animationSources = animationSourcesMap[appearanceTheme];
    }

    const sourceUrl = animationSources[animationStateToUse];

    const loop = animationStateToUse === AnimationState.VpnEnabled
        || animationStateToUse === AnimationState.VpnDisabled;

    const handleAnimationEnd = (): void => {
        settingsStore.handleAnimationEnd();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!context || !canvas) {
            return undefined;
        }

        const updateCanvas = (video: HTMLVideoElement): void => {
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

        const loadedDataHandler = async (): Promise<void> => {
            await video.play();
            updateCanvas(video);
        };
        video.addEventListener('loadeddata', loadedDataHandler);

        return (): void => {
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
