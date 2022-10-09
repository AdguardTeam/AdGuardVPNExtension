import React, { useContext, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useMachine } from '@xstate/react';

import { rootStore } from '../../../stores';
import { VideoStateEvent, videoStateMachine } from './videoStateMachine';
import {
    Animation,
    APPEARANCE_THEMES,
    videoPostersMap,
    videoSourcesMap,
} from '../../../../lib/constants';

interface BackgroundVideoProps {
    exclusionsScreen?: boolean;
}

export const BackgroundVideo = observer(({ exclusionsScreen }: BackgroundVideoProps) => {
    const { settingsStore } = useContext(rootStore);

    const { isConnected, appearanceTheme, systemTheme } = settingsStore;

    const [videoState, sendToVideoStateMachine] = useMachine(videoStateMachine);

    sendToVideoStateMachine(
        isConnected
            ? VideoStateEvent.Connected
            : VideoStateEvent.Disconnected,
    );

    const videoRef = useRef<HTMLVideoElement>(null);

    const videoSources = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? videoSourcesMap[systemTheme]
        : videoSourcesMap[appearanceTheme];

    const videoPosters = appearanceTheme === APPEARANCE_THEMES.SYSTEM
        ? videoPostersMap[systemTheme]
        : videoPostersMap[appearanceTheme];

    let sourceUrl = videoSources[videoState.value as Animation];
    let posterUrl = videoPosters[videoState.value as Animation];

    if (exclusionsScreen) {
        sourceUrl = videoSources[Animation.Disconnected];
        posterUrl = videoPosters[Animation.Disconnected];
    }

    const loop = videoState.value === Animation.Connected
        || videoState.value === Animation.Disconnected;

    useEffect(() => {
        videoRef.current?.load();
    });

    const handleVideoEnd = () => {
        sendToVideoStateMachine(VideoStateEvent.VideoEnded);
    };

    return (
        <video
            ref={videoRef}
            autoPlay
            loop={loop}
            className="settings__video"
            poster={posterUrl}
            onEnded={handleVideoEnd}
        >
            <source src={sourceUrl} type="video/webm" />
            <track kind="captions" />
        </video>
    );
});
