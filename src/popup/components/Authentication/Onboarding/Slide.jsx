import React, { useContext } from 'react';
import { rootStore } from '../../../stores';
import './onboarding.pcss';
import { reactTranslator } from '../../../../common/reactTranslator';
import { DotsIndicator } from '../../ui/DotsIndicator';
import { CloseButton } from '../../ui/CloseButton';

export const Slide = (props) => {
    const { settingsStore } = useContext(rootStore);

    const {
        slideData,
        nextSlideHandler,
        slidesAmount,
    } = props;

    const {
        id,
        image,
        title,
        info,
    } = slideData;

    const handleCloseClick = async () => {
        await settingsStore.setShowOnboarding(false);
    };

    return (
        <div className={`slide slide-${id}`}>
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
                activeDot={id}
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
