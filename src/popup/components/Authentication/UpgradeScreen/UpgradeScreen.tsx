import React, { useContext, useState } from 'react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { CloseButton } from '../../ui/CloseButton';
import { Slider } from '../../ui/Slider';
import { UNLIMITED_FEATURES } from '../../../../common/components/constants';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry';

import './upgrade-screen.pcss';

export const UpgradeScreen = () => {
    const { authStore, vpnStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.PurchaseScreen,
    );

    const handleUpgradeClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OnboardingPurchaseClick,
            TelemetryScreenName.PurchaseScreen,
        );
        await authStore.setShowUpgradeScreen(false);
        await vpnStore.openPremiumPromoPage();
        window.close();
    };

    const handleSkipClick = async (): Promise<void> => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OnboardingStayFreeClick,
            TelemetryScreenName.PurchaseScreen,
        );
        await authStore.setShowUpgradeScreen(false);
    };

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const nextSlideHandler = async (): Promise<void> => {
        if (currentSlideIndex !== UNLIMITED_FEATURES.length - 1) {
            return setCurrentSlideIndex(currentSlideIndex + 1);
        }

        return setCurrentSlideIndex(0);
    };

    const prevSlideHandler = async (): Promise<void> => {
        if (currentSlideIndex !== 0) {
            return setCurrentSlideIndex(currentSlideIndex - 1);
        }

        return setCurrentSlideIndex(UNLIMITED_FEATURES.length - 1);
    };

    const setCurrentSlide = (index: number): void => {
        setCurrentSlideIndex(index);
    };

    return (
        <div className="upgrade-screen">
            <CloseButton handler={handleSkipClick} />
            <div className="upgrade-screen__head">
                <div className="upgrade-screen__title">
                    {translator.getMessage('popup_upgrade_screen_title')}
                </div>
            </div>
            <div className="upgrade-screen__slider">
                <Slider
                    arrows
                    sliderMod="medium"
                    slideIndex={currentSlideIndex}
                    slideData={UNLIMITED_FEATURES[currentSlideIndex]}
                    nextSlideHandler={nextSlideHandler}
                    prevSlideHandler={prevSlideHandler}
                    navigationHandler={setCurrentSlide}
                    slidesAmount={UNLIMITED_FEATURES.length}
                />
            </div>
            <div className="upgrade-screen__actions">
                <button
                    type="button"
                    onClick={handleUpgradeClick}
                    className="button button--large button--green"
                >
                    {translator.getMessage('popup_upgrade_screen_upgrade_button')}
                </button>
                <button
                    type="button"
                    onClick={handleSkipClick}
                    className="button button--medium upgrade-screen__continue-button"
                >
                    {translator.getMessage('popup_upgrade_screen_continue_free')}
                </button>
            </div>
        </div>
    );
};
