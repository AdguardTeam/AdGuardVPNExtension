import React from 'react';
import Lottie from 'react-lottie';
import animationData from './enabledStatusAnimation.json';

const EnabledStatusAnimation = () => {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };

    return <Lottie options={defaultOptions} width={200} height={198} />;
};

export default EnabledStatusAnimation;
