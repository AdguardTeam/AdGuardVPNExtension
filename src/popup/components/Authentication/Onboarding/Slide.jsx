import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { DotsIndicator } from '../../ui/DotsIndicator';
import { CloseButton } from '../../ui/CloseButton';

import './onboarding.pcss';

export var Slide = function (props) {
    const { authStore } = useContext(rootStore);

    const {
        slideIndex,
        slideData,
        nextSlideHandler,
        navigationHandler,
        slidesAmount,
    } = props;

    const {
        image,
        title,
        info,
    } = slideData;

    const handleCloseClick = async () => {
        await authStore.setShowOnboarding(false);
    };

    return (
        <div className={`slide slide-${slideIndex}`}>
            <CloseButton handler={handleCloseClick} />
            <img
                src={`../../../../assets/images/${image}`}
                className="slide__image"
                alt="slide"
            />
            <div className="slide__title">
                {title}
            </div>
            <div className="slide__info">
                {info}
            </div>
            <DotsIndicator
                dotsAmount={slidesAmount}
                activeDot={slideIndex}
                navigationHandler={navigationHandler}
            />
            <button
                type="button"
                onClick={nextSlideHandler}
                className="button button--medium button--green slide__button-next"
            >
                {reactTranslator.getMessage('popup_onboarding_next')}
            </button>
        </div>
    );
};
