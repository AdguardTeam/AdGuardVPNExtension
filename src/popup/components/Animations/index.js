import React from 'react';
import Lottie from 'react-lottie';
import animationData from './bush.json';

function Bush() {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return <Lottie options={defaultOptions} width={200} height={200} />;
}

export default Bush;
