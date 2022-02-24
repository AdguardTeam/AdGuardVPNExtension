import React, { useContext, useState } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { CloseButton } from '../../ui/CloseButton';
import { Slider } from '../../ui/Slider';
import { UNLIMITED_FEATURES } from '../../../../common/components/constants';

import './upgrade-screen.pcss';

export const UpgradeScreen = () => {
    const { authStore, vpnStore } = useContext(rootStore);

    const handleUpgradeClick = async () => {
        await authStore.setShowUpgradeScreen(false);
        await vpnStore.openPremiumPromoPage();
    };

    const handleSkipClick = async () => {
        await authStore.setShowUpgradeScreen(false);
    };

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const nextSlideHandler = async () => {
        if (currentSlideIndex !== UNLIMITED_FEATURES.length - 1) {
            return setCurrentSlideIndex(currentSlideIndex + 1);
        }

        return setCurrentSlideIndex(0);
    };

    const prevSlideHandler = async () => {
        if (currentSlideIndex !== 0) {
            return setCurrentSlideIndex(currentSlideIndex - 1);
        }

        return setCurrentSlideIndex(UNLIMITED_FEATURES.length - 1);
    };

    const setCurrentSlide = (index) => {
        setCurrentSlideIndex(index);
    };

    return (
        <div className="upgrade-screen">
            <CloseButton handler={handleSkipClick} />
            <div className="upgrade-screen__head">
                <div className="upgrade-screen__title">
                    {reactTranslator.getMessage('popup_upgrade_screen_title')}
                </div>
            </div>
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
            <button
                type="button"
                onClick={handleUpgradeClick}
                className="button button--medium button--green upgrade-screen__subscribe-button"
            >
                {reactTranslator.getMessage('popup_upgrade_screen_upgrade_button')}
            </button>
            <button
                type="button"
                onClick={handleSkipClick}
                className="button button--medium upgrade-screen__continue-button"
            >
                {reactTranslator.getMessage('popup_upgrade_screen_continue_free')}
            </button>
        </div>
    );
};
