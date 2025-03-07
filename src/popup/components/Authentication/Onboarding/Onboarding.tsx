import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry';
import { Slider } from '../../ui/Slider';

import './onboarding.pcss';

export const Onboarding = observer(() => {
    const { authStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.OnboardingScreen,
    );

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const slides = [
        {
            image: 'onboarding-unique-protocol.svg',
            title: translator.getMessage('popup_onboarding_unique_protocol'),
            info: translator.getMessage('popup_onboarding_unique_protocol_info'),
        },
        {
            image: 'onboarding-sites-app-exclusions.svg',
            title: translator.getMessage('popup_onboarding_sites_apps_exclusions'),
            info: translator.getMessage('popup_onboarding_sites_apps_exclusions_info'),
        },
        {
            image: 'onboarding-no-logging-policy.svg',
            title: translator.getMessage('popup_onboarding_no_logging_policy'),
            info: translator.getMessage('popup_onboarding_no_logging_policy_info'),
        },
    ];

    const nextSlideHandler = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.NextOnboardingClick,
            TelemetryScreenName.OnboardingScreen,
        );
        if (currentSlideIndex === slides.length - 1) {
            await authStore.setShowOnboarding(false);
            return;
        }
        setCurrentSlideIndex(currentSlideIndex + 1);
    };

    const setCurrentSlide = (index: number): void => {
        setCurrentSlideIndex(index);
    };

    const handleCloseClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SkipOnboardingClick,
            TelemetryScreenName.OnboardingScreen,
        );
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
