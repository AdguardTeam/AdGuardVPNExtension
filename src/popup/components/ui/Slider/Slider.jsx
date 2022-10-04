import React from 'react';
import cn from 'classnames';
import { reactTranslator } from '../../../../common/reactTranslator';
import { DotsIndicator } from '../DotsIndicator';
import { CloseButton } from '../CloseButton';

import './slider.pcss';
import Icon from '../Icon';

export const Slider = (props) => {
    const {
        slideIndex,
        slideData,
        nextSlideHandler,
        prevSlideHandler,
        navigationHandler,
        slidesAmount,
        handleCloseClick,
        button,
        arrows,
        sliderMod,
    } = props;

    const {
        image,
        title,
        info,
    } = slideData;

    const sliderClassName = cn(`slider slider-${slideIndex}`, { [`slider--${sliderMod}`]: sliderMod });

    return (
        <div className={sliderClassName}>
            {handleCloseClick && (
                <CloseButton handler={handleCloseClick} />
            )}
            <div className="slider__slide">
                {arrows && (
                    <>
                        <div
                            className="slider__arrow slider__arrow--left"
                            onClick={prevSlideHandler}
                        >
                            <Icon icon="arrow" className="slider__arrow-pic" />
                        </div>
                        <div
                            className="slider__arrow slider__arrow--right"
                            onClick={nextSlideHandler}
                        >
                            <Icon icon="arrow" className="slider__arrow-pic" />
                        </div>
                    </>
                )}
                <img
                    src={`../../../../assets/images/${image}`}
                    className="slider__image"
                    alt="slide"
                />
            </div>
            <div className="slider__content">
                <div className="slider__title">
                    {title}
                </div>
                <div className="slider__info">
                    {info}
                </div>
                <div className="slider__indicator">
                    <DotsIndicator
                        dotsAmount={slidesAmount}
                        activeDot={slideIndex}
                        navigationHandler={navigationHandler}
                    />
                </div>
            </div>
            {button && (
                <button
                    type="button"
                    onClick={nextSlideHandler}
                    className="button button--large button--green slider__button-next"
                >
                    {reactTranslator.getMessage('popup_onboarding_next')}
                </button>
            )}
        </div>
    );
};
