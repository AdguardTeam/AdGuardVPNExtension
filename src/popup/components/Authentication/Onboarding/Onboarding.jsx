import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { Slider } from '../../ui/Slider';

import './onboarding.pcss';

export const Onboarding = observer(() => {
    const { authStore } = useContext(rootStore);

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const slides = [
        {
            image: 'trusted-vpn.svg',
            title: reactTranslator.getMessage('popup_onboarding_trusted_vpn'),
            info: reactTranslator.getMessage('popup_onboarding_trusted_vpn_info'),
        },
        {
            image: 'numerous-locations.svg',
            title: reactTranslator.getMessage('popup_onboarding_numerous_locations'),
            info: reactTranslator.getMessage('popup_onboarding_numerous_locations_info'),
        },
        {
            image: 'fastest-servers.svg',
            title: reactTranslator.getMessage('popup_onboarding_fastest_servers'),
            info: reactTranslator.getMessage('popup_onboarding_fastest_servers_info'),
        },
    ];

    const nextSlideHandler = async () => {
        if (currentSlideIndex === slides.length - 1) {
            await authStore.setShowOnboarding(false);
            return;
        }
        setCurrentSlideIndex(currentSlideIndex + 1);
    };

    const setCurrentSlide = (index) => {
        setCurrentSlideIndex(index);
    };

    const handleCloseClick = async () => {
        await authStore.setShowOnboarding(false);
    };

    return (
        <div className="onboarding">
            <Slider
                button
                handleCloseClick={handleCloseClick}
                slideIndex={currentSlideIndex}
                slideData={slides[currentSlideIndex]}
                nextSlideHandler={nextSlideHandler}
                navigationHandler={setCurrentSlide}
                slidesAmount={slides.length}
            />
        </div>
    );
});
