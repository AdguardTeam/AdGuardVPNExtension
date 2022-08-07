import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react';

interface BackgroundVideoProps {
    videoUrl: string,
    visible?: boolean,
    loop?: boolean,
    onEndedHandler?: () => void,
}

const BackgroundVideo = observer(({
    videoUrl,
    visible = true,
    loop = true,
    onEndedHandler = (() => {}),
}: BackgroundVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>();

    useEffect(() => {
        videoRef.current?.load();
    }, [videoUrl]);

    if (visible) {
        return (
            <video
                // @ts-ignore FIXME remove ts-ignore
                ref={videoRef}
                aria-hidden="true"
                className="settings__video"
                playsInline
                autoPlay
                loop={loop}
                onEnded={onEndedHandler}
            >
                <source src={videoUrl} type="video/webm" />
                <track kind="captions" />
            </video>
        );
    }

    return null;
});

export { BackgroundVideo };
