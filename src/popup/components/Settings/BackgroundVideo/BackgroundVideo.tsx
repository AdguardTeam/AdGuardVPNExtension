import React, { useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { videoService } from './videoStateMachine';
import {
    AnimationState,
    AnimationEvent,
    APPEARANCE_THEMES,
    videoSourcesMap,
} from '../../../../lib/constants';

interface BackgroundVideoProps {
    exclusionsScreen?: boolean;
}

export const BackgroundVideo = observer(({ exclusionsScreen }: BackgroundVideoProps) => {
    const { settingsStore } = useContext(rootStore);

    const { isConnected, appearanceTheme, systemTheme } = settingsStore;

    // const initialState = isConnected ? AnimationState.VpnEnabled : AnimationState.VpnDisabled;
    // const videoStateMachine = getVideoStateMachine(initialState);

    const initialEvent = isConnected ? AnimationEvent.VpnConnected : AnimationEvent.VpnDisconnected;
    videoService.send(initialEvent);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    let videoSources = videoSourcesMap[systemTheme];

    if (appearanceTheme && appearanceTheme !== APPEARANCE_THEMES.SYSTEM) {
        videoSources = videoSourcesMap[appearanceTheme];
    }

    const currentStateValue = videoService.getSnapshot().value;

    let sourceUrl = videoSources[currentStateValue as AnimationState];

    if (exclusionsScreen) {
        sourceUrl = videoSources[AnimationState.VpnDisabled];
    }

    const loop = currentStateValue === AnimationState.VpnEnabled
        || currentStateValue === AnimationState.VpnDisabled;

    const handleVideoEnd = () => {
        videoService.send(AnimationEvent.AnimationEnded);
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
        video.onended = handleVideoEnd;
        video.addEventListener('loadeddata', async () => {
            await video.play();
            updateCanvas(video);
        });
    });

    return (
        <canvas ref={canvasRef} className="settings__video">
            Background video
        </canvas>
    );
});
