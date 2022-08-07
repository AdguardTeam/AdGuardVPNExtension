import React, { useEffect, useRef } from 'react';

interface BackgroundVideoProps {
    videoUrl: string,
    visible?: boolean,
    loop?: boolean,
    onEndedHandler?: () => void,
}

const BackgroundVideo = ({
    videoUrl,
    visible = true,
    loop = true,
    onEndedHandler = (() => {}),
}: BackgroundVideoProps) => {
    if (!visible) {
        return null;
    }

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        videoRef.current?.load();
    }, [videoUrl]);

    return (
        <video
            ref={videoRef}
            className="settings__video"
            autoPlay
            loop={loop}
            onEnded={onEndedHandler}
        >
            <source src={videoUrl} type="video/webm" />
            <track kind="captions" />
        </video>
    );
};

export { BackgroundVideo };
