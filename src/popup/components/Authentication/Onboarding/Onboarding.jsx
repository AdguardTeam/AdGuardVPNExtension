import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { Slide } from './Slide';

import './onboarding.pcss';

export const Onboarding = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const [currentSlideId, setCurrentSlideId] = useState(0);

    const slides = [
        {
            id: 0,
            image: 'trusted-vpn.svg',
            title: reactTranslator.getMessage('popup_onboarding_first_title'),
            info: reactTranslator.getMessage('popup_onboarding_first_info'),
        },
        {
            id: 1,
            image: 'numerous-locations.svg',
            title: reactTranslator.getMessage('popup_onboarding_second_title'),
            info: reactTranslator.getMessage('popup_onboarding_second_info'),
        },
        {
            id: 2,
            image: 'fastest-servers.svg',
            title: reactTranslator.getMessage('popup_onboarding_third_title'),
            info: reactTranslator.getMessage('popup_onboarding_third_info'),
        },
    ];

    const nextSlideHandler = async () => {
        if (currentSlideId === slides.length - 1) {
            await settingsStore.setShowOnboarding(false);
            return;
        }
        setCurrentSlideId(currentSlideId + 1);
    };

    return (
        <div className="onboarding">
            <Slide
                slideData={slides[currentSlideId]}
                nextSlideHandler={nextSlideHandler}
                slidesAmount={slides.length}
            />
        </div>
    );
});
