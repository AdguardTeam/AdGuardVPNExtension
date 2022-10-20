import React, { useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useMachine } from '@xstate/react';

import { rootStore } from '../../../stores';
import { VideoStateEvent, videoStateMachine } from './videoStateMachine';
import {
    Animation,
    APPEARANCE_THEMES,
    videoSourcesMap,
} from '../../../../lib/constants';

interface BackgroundVideoProps {
    exclusionsScreen?: boolean;
}

export const BackgroundVideo = observer(({ exclusionsScreen }: BackgroundVideoProps) => {
    const { settingsStore } = useContext(rootStore);

    const { isConnected, appearanceTheme, systemTheme } = settingsStore;

    const [videoState, sendToVideoStateMachine] = useMachine(videoStateMachine);

    const initialState = isConnected ? VideoStateEvent.Connected : VideoStateEvent.Disconnected;
    sendToVideoStateMachine(initialState);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const videoSources = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? videoSourcesMap[systemTheme]
        : videoSourcesMap[appearanceTheme];

    let sourceUrl = videoSources[videoState.value as Animation];

    if (exclusionsScreen) {
        sourceUrl = videoSources[Animation.Disconnected];
    }

    const loop = videoState.value === Animation.Connected
        || videoState.value === Animation.Disconnected;

    const handleVideoEnd = () => {
        sendToVideoStateMachine(VideoStateEvent.VideoEnded);
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
