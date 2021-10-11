import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { Slide } from './Slide';

import './onboarding.pcss';

export const Onboarding = observer(() => {
    const { authStore } = useContext(rootStore);

    const [currentSlideId, setCurrentSlideId] = useState(0);

    const slides = [
        {
            id: 0,
            image: 'trusted-vpn.svg',
            title: reactTranslator.getMessage('popup_onboarding_trusted_vpn'),
            info: reactTranslator.getMessage('popup_onboarding_trusted_vpn_info'),
        },
        {
            id: 1,
            image: 'numerous-locations.svg',
            title: reactTranslator.getMessage('popup_onboarding_numerous_locations'),
            info: reactTranslator.getMessage('popup_onboarding_numerous_locations_info'),
        },
        {
            id: 2,
            image: 'fastest-servers.svg',
            title: reactTranslator.getMessage('popup_onboarding_fastest_servers'),
            info: reactTranslator.getMessage('popup_onboarding_fastest_servers_info'),
        },
    ];

    const nextSlideHandler = async () => {
        if (currentSlideId === slides.length - 1) {
            await authStore.setShowOnboarding(false);
            return;
        }
        setCurrentSlideId(currentSlideId + 1);
    };

    const setCurrentSlide = (slideId) => {
        setCurrentSlideId(slideId);
    };

    return (
        <div className="onboarding">
            <Slide
                slideData={slides[currentSlideId]}
                nextSlideHandler={nextSlideHandler}
                navigationHandler={setCurrentSlide}
                slidesAmount={slides.length}
            />
        </div>
    );
});
