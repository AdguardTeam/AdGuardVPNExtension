import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore, type OnboardingGoal } from '../../../stores';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { Icon, IconButton } from '../../../../common/components/Icons';
import { Slider } from '../../ui/Slider';
import beginningQuestionUrl from '../../../../assets/images/onboarding/beginning_question.svg';
import { useOnboardingSlides } from '../useOnboardingSlides';

import { getGoalSlides } from './personalizedOnboardingConfig';

import './personalized-onboarding.pcss';

/**
 * Ordered list of goals rendered on the choice screen.
 */
const GOAL_OPTIONS: {
    goal: OnboardingGoal;
    labelKey: string;
    clickAction: TelemetryActionName;
}[] = [
    {
        goal: 'privacy',
        labelKey: 'popup_onboarding_choice_privacy',
        clickAction: TelemetryActionName.ProtectPrivacyClick,
    },
    {
        goal: 'streaming',
        labelKey: 'popup_onboarding_choice_streaming',
        clickAction: TelemetryActionName.StreamTvClick,
    },
    {
        goal: 'bypass',
        labelKey: 'popup_onboarding_choice_bypass',
        clickAction: TelemetryActionName.BypassCensorClick,
    },
];

/**
 * AG-55378 personalized onboarding: goal choice screen followed by a
 * goal-specific slide flow. Shown only for the test variant.
 */
export const PersonalizedOnboarding = observer(() => {
    const { authStore, uiStore, telemetryStore } = useContext(rootStore);
    const { onboardingGoal } = uiStore;

    const slides = onboardingGoal ? getGoalSlides(onboardingGoal) : [];

    const completeOnboarding = async (): Promise<void> => {
        await authStore.setShowOnboarding(false);
    };

    const {
        slideIndex,
        setSlideIndex,
        nextSlideHandler,
        handleCloseClick: handleSlidesClose,
    } = useOnboardingSlides(slides.length, {
        onComplete: completeOnboarding,
    });

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.ChoiceOnboardingScreen,
        onboardingGoal === null,
    );

    const handleGoalClick = (selected: OnboardingGoal, clickAction: TelemetryActionName): void => {
        telemetryStore.sendCustomEvent(
            clickAction,
            TelemetryScreenName.ChoiceOnboardingScreen,
        );
        uiStore.setOnboardingGoal(selected);
        setSlideIndex(0);
    };

    const handleChoiceClose = async (): Promise<void> => {
        uiStore.setOnboardingGoal(null);
        await completeOnboarding();
    };

    const handleOtherClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.OtherClick,
            TelemetryScreenName.ChoiceOnboardingScreen,
        );
        handleChoiceClose();
    };

    if (onboardingGoal === null) {
        return (
            <div className="choice-onboarding">
                <IconButton
                    name="cross"
                    className="close-icon-btn"
                    onClick={handleChoiceClose}
                />
                <div className="choice-onboarding__image-wrapper">
                    <img
                        src={beginningQuestionUrl}
                        className="choice-onboarding__image"
                        alt="onboarding"
                    />
                </div>
                <div className="choice-onboarding__title">
                    {translator.getMessage('popup_onboarding_choice_title')}
                </div>
                <div className="choice-onboarding__options">
                    {GOAL_OPTIONS.map(({ goal: optionGoal, labelKey, clickAction }) => (
                        <button
                            key={optionGoal}
                            type="button"
                            className="choice-onboarding__option"
                            onClick={(): void => handleGoalClick(optionGoal, clickAction)}
                        >
                            <span>{translator.getMessage(labelKey)}</span>
                            <Icon
                                name="arrow-down"
                                size="20"
                                className="choice-onboarding__option-arrow"
                                rotation="clockwise"
                            />
                        </button>
                    ))}
                    <button
                        type="button"
                        className="choice-onboarding__option"
                        onClick={handleOtherClick}
                    >
                        <span>{translator.getMessage('popup_onboarding_choice_other')}</span>
                        <Icon
                            name="arrow-down"
                            size="20"
                            className="choice-onboarding__option-arrow"
                            rotation="clockwise"
                        />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="onboarding">
            <Slider
                button
                sliderMod="personalized"
                handleCloseClick={handleSlidesClose}
                slideIndex={slideIndex}
                slideData={slides[slideIndex]}
                nextSlideHandler={nextSlideHandler}
                navigationHandler={setSlideIndex}
                slidesAmount={slides.length}
            />
        </div>
    );
});
