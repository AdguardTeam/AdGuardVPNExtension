import { type OnboardingGoal } from '../../../stores';
import { translator } from '../../../../common/translator';
import { UNLIMITED_LOCATIONS_COUNT } from '../../../../common/components/constants';
import privacy1Url from '../../../../assets/images/onboarding/privacy_1.svg';
import privacy2Url from '../../../../assets/images/onboarding/privacy_2.svg';
import privacy3Url from '../../../../assets/images/onboarding/privacy_3.svg';
import tv1Url from '../../../../assets/images/onboarding/tv_1.svg';
import tv2Url from '../../../../assets/images/onboarding/tv_2.svg';
import tv3Url from '../../../../assets/images/onboarding/tv_3.svg';
import bypass1Url from '../../../../assets/images/onboarding/bypass_1.svg';
import bypass2Url from '../../../../assets/images/onboarding/bypass_2.svg';
import bypass3Url from '../../../../assets/images/onboarding/bypass_3.svg';

/**
 * A single onboarding slide's content.
 */
interface OnboardingSlideContent {
    /**
     * Slide illustration URL.
     */
    imageUrl: string;

    /**
     * Slide title.
     */
    title: string;

    /**
     * Slide description.
     */
    info: string;
}

/**
 * Builds slide content for a single onboarding goal branch.
 *
 * @param goal Selected onboarding goal.
 *
 * @returns Three slides for the given goal.
 */
export const getGoalSlides = (goal: OnboardingGoal): OnboardingSlideContent[] => {
    switch (goal) {
        case 'privacy':
            return [
                {
                    imageUrl: privacy1Url,
                    title: translator.getMessage('popup_onboarding_privacy_1_title'),
                    info: translator.getMessage('popup_onboarding_privacy_1_info'),
                },
                {
                    imageUrl: privacy2Url,
                    title: translator.getMessage('popup_onboarding_privacy_2_title'),
                    info: translator.getMessage('popup_onboarding_privacy_2_info'),
                },
                {
                    imageUrl: privacy3Url,
                    title: translator.getMessage('popup_onboarding_privacy_3_title'),
                    info: translator.getMessage('popup_onboarding_privacy_3_info'),
                },
            ];
        case 'streaming':
            return [
                {
                    imageUrl: tv1Url,
                    title: translator.getMessage('popup_onboarding_streaming_1_title'),
                    info: translator.getMessage('popup_onboarding_streaming_1_info'),
                },
                {
                    imageUrl: tv2Url,
                    title: translator.getMessage('popup_onboarding_streaming_2_title'),
                    info: translator.getPlural(
                        'popup_onboarding_streaming_2_info',
                        UNLIMITED_LOCATIONS_COUNT,
                    ),
                },
                {
                    imageUrl: tv3Url,
                    title: translator.getMessage('popup_onboarding_streaming_3_title'),
                    info: translator.getMessage('popup_onboarding_streaming_3_info'),
                },
            ];
        case 'bypass':
            return [
                {
                    imageUrl: bypass1Url,
                    title: translator.getMessage('popup_onboarding_bypass_1_title'),
                    info: translator.getMessage('popup_onboarding_bypass_1_info'),
                },
                {
                    imageUrl: bypass2Url,
                    title: translator.getMessage('popup_onboarding_bypass_2_title'),
                    info: translator.getMessage('popup_onboarding_bypass_2_info'),
                },
                {
                    imageUrl: bypass3Url,
                    title: translator.getMessage('popup_onboarding_bypass_3_title'),
                    info: translator.getMessage('popup_onboarding_bypass_3_info'),
                },
            ];
        default: {
            // Exhaustiveness check for OnboardingGoal.
            const exhaustiveCheck: never = goal;
            return exhaustiveCheck;
        }
    }
};
