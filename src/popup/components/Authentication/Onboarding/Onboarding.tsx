import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import uniqueProtocolImageUrl from '../../../../assets/images/onboarding-unique-protocol.svg';
import sitesAppExclusionsImageUrl from '../../../../assets/images/onboarding-sites-app-exclusions.svg';
import noLoggingPolicyImageUrl from '../../../../assets/images/onboarding-no-logging-policy.svg';
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
            imageUrl: uniqueProtocolImageUrl,
            title: translator.getMessage('popup_onboarding_unique_protocol'),
            info: translator.getMessage('popup_onboarding_unique_protocol_info'),
        },
        {
            imageUrl: sitesAppExclusionsImageUrl,
            title: translator.getMessage('popup_onboarding_sites_apps_exclusions'),
            info: translator.getMessage('popup_onboarding_sites_apps_exclusions_info'),
        },
        {
            imageUrl: noLoggingPolicyImageUrl,
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
