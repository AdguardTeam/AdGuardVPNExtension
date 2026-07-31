import { useState } from 'react';

/**
 * Options for shared onboarding slide transitions.
 */
interface UseOnboardingSlidesOptions {
    /**
     * Called when the last slide is advanced or the user closes the slideshow.
     */
    onComplete: () => void | Promise<void>;

    /**
     * Optional side-effect when advancing (e.g. telemetry).
     */
    onNext?: () => void;

    /**
     * Optional side-effect when closing (e.g. telemetry).
     */
    onClose?: () => void;
}

/**
 * Result of the onboarding slides hook.
 */
interface UseOnboardingSlidesResult {
    /**
     * Current slide index.
     */
    slideIndex: number;

    /**
     * Sets the current slide index.
     */
    setSlideIndex: (index: number) => void;

    /**
     * Advances to the next slide, or completes when on the last slide.
     */
    nextSlideHandler: () => Promise<void>;

    /**
     * Closes the slideshow and completes onboarding.
     */
    handleCloseClick: () => Promise<void>;
}

/**
 * Shared advance-or-complete carousel transitions for onboarding slide flows.
 *
 * @param slidesCount Total number of slides.
 * @param options Completion and optional telemetry callbacks.
 * @returns Slide index state and handlers.
 */
export const useOnboardingSlides = (
    slidesCount: number,
    options: UseOnboardingSlidesOptions,
): UseOnboardingSlidesResult => {
    const { onComplete, onNext, onClose } = options;
    const [slideIndex, setSlideIndex] = useState(0);

    const nextSlideHandler = async (): Promise<void> => {
        onNext?.();
        if (slideIndex >= slidesCount - 1) {
            await onComplete();
            return;
        }
        setSlideIndex(slideIndex + 1);
    };

    const handleCloseClick = async (): Promise<void> => {
        onClose?.();
        await onComplete();
    };

    return {
        slideIndex,
        setSlideIndex,
        nextSlideHandler,
        handleCloseClick,
    };
};
