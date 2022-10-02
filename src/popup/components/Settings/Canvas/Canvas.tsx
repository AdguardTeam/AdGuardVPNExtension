import React, { useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { createMachine } from 'xstate';
import { useMachine } from '@xstate/react';

import {
    Animation,
    APPEARANCE_THEMES,
    videoPostersMap,
    videoSourcesMap,
} from '../../../../lib/constants';

import { rootStore } from '../../../stores';

enum VideoStateEvent {
    Connected = 'connected',
    Disconnected = 'disconnected',
    SwitchedOn = 'switched-on',
    SwitchedOff = 'switched-off',
}

const videoStateMachine = createMachine({
    id: 'videoStateMachine',
    initial: Animation.Disconnected,
    states: {
        [Animation.Disconnected]: {
            on: {
                [VideoStateEvent.Connected]: {
                    target: Animation.SwitchOn,
                },
            },
        },
        [Animation.Connected]: {
            on: {
                [VideoStateEvent.Disconnected]: {
                    target: Animation.SwitchOff,
                },
            },
        },
        [Animation.SwitchOff]: {
            on: {
                [VideoStateEvent.SwitchedOff]: {
                    target: Animation.Disconnected,
                },
            },
        },
        [Animation.SwitchOn]: {
            on: {
                [VideoStateEvent.SwitchedOn]: {
                    target: Animation.Connected,
                },
            },
        },
    },
});

export const Canvas = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const { isConnected, appearanceTheme, systemTheme } = settingsStore;

    const [videoState, sendToVideoStateMachine] = useMachine(videoStateMachine);

    sendToVideoStateMachine(
        isConnected
            ? VideoStateEvent.Connected
            : VideoStateEvent.Disconnected,
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const videoSources = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? videoSourcesMap[systemTheme]
        : videoSourcesMap[appearanceTheme];

    const videoPosters = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? videoPostersMap[systemTheme]
        : videoPostersMap[appearanceTheme];

    const sourceUrl = videoSources[videoState.value as Animation];
    const posterUrl = videoPosters[videoState.value as Animation];
    const loop = videoState.value === Animation.Connected
        || videoState.value === Animation.Disconnected;

    useEffect(() => {
        videoRef.current?.load();

        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const step = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    });

    const handleVideoEnd = () => {
        if (videoState.value === Animation.SwitchOff) {
            sendToVideoStateMachine(VideoStateEvent.SwitchedOff);
        }
        if (videoState.value === Animation.SwitchOn) {
            sendToVideoStateMachine(VideoStateEvent.SwitchedOn);
        }
    };

    return (
        <>
            <video
                ref={videoRef}
                autoPlay
                loop={loop}
                className="settings__no-display"
                poster={posterUrl}
                onEnded={handleVideoEnd}
            >
                <source src={sourceUrl} type="video/webm" />
                <track kind="captions" />
            </video>
            <canvas ref={canvasRef} className="settings__canvas">
                Background video
            </canvas>
        </>
    );
});
