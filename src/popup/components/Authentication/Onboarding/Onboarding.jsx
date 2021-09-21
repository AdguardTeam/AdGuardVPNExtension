import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { rootStore } from '../../../stores';
import './onboarding.pcss';
import { reactTranslator } from '../../../../common/reactTranslator';
import { Slide } from './Slide';

export const Onboarding = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { onboardingSlide } = settingsStore;

    const slides = [
        {
            image: 'trusted-vpn.svg',
            title: reactTranslator.getMessage('popup_onboarding_first_title'),
            info: reactTranslator.getMessage('popup_onboarding_first_info'),
        },
        {
            image: 'numerous-locations.svg',
            title: reactTranslator.getMessage('popup_onboarding_second_title'),
            info: reactTranslator.getMessage('popup_onboarding_second_info'),
        },
        {
            image: 'fastest-servers.svg',
            title: reactTranslator.getMessage('popup_onboarding_third_title'),
            info: reactTranslator.getMessage('popup_onboarding_third_info'),
        },
    ];

    if (onboardingSlide) {
        return (
            <div className="onboarding">
                <Slide
                    title={slides[onboardingSlide - 1].title}
                    image={slides[onboardingSlide - 1].image}
                    info={slides[onboardingSlide - 1].info}
                    dots={slides.length}
                    active={onboardingSlide}
                />
            </div>
        );
    }

    return (
        <></>
    );
});
