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
            image: 'onboarding-unique-protocol.svg',
            title: reactTranslator.getMessage('popup_onboarding_unique_protocol'),
            info: reactTranslator.getMessage('popup_onboarding_unique_protocol_info'),
        },
        {
            image: 'onboarding-sites-app-exclusions.svg',
            title: reactTranslator.getMessage('popup_onboarding_sites_apps_exclusions'),
            info: reactTranslator.getMessage('popup_onboarding_sites_apps_exclusions_info'),
        },
        {
            image: 'onboarding-no-logging-policy.svg',
            title: reactTranslator.getMessage('popup_onboarding_no_logging_policy'),
            info: reactTranslator.getMessage('popup_onboarding_no_logging_policy_info'),
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
