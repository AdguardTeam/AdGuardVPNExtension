import React from 'react';

import cn from 'classnames';

import { reactTranslator } from '../../../../common/reactTranslator';
import { DotsIndicator } from '../DotsIndicator';
import { CloseButton } from '../CloseButton';
import { Icon } from '../Icon';

import './slider.pcss';

type SlideData = {
    image: string,
    title: string | React.ReactNode,
    info: string | React.ReactNode,
};

type SliderProps = {
    slideIndex: number,
    slideData: SlideData,
    nextSlideHandler: () => Promise<void>,
    prevSlideHandler?: () => Promise<void>,
    navigationHandler: (index: number) => void,
    slidesAmount: number,
    handleCloseClick?: () => void,
    button?: boolean,
    arrows?: boolean,
    sliderMod?: string,
};

export const Slider = (props: SliderProps) => {
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
                        <button
                            type="button"
                            className="slider__arrow slider__arrow--left"
                            onClick={prevSlideHandler}
                        >
                            <Icon icon="arrow" className="slider__arrow-pic" />
                        </button>
                        <button
                            type="button"
                            className="slider__arrow slider__arrow--right"
                            onClick={nextSlideHandler}
                        >
                            <Icon icon="arrow" className="slider__arrow-pic" />
                        </button>
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
