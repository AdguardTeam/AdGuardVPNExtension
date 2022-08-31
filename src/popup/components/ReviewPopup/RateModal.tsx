import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../stores';
import { PATH_TO_RATING_IMAGES, RATING_IMAGES_MAP } from './constants';
import { reactTranslator } from '../../../common/reactTranslator';
import Icon from '../ui/Icon';

import './rate-modal.pcss';

const RATING_STARS = [5, 4, 3, 2, 1];

const DEFAULT_RATING_IMAGE = RATING_IMAGES_MAP[5];
const DEFAULT_RATING_IMAGE_PATH = `${PATH_TO_RATING_IMAGES}${DEFAULT_RATING_IMAGE}`;

export const RateModal = observer(() => {
    const { authStore } = useContext(rootStore);

    const { rating, setRating, showRateModal } = authStore;

    const [ratingHovered, setRatingHovered] = useState<number | null>(null);
    const [mainImagePath, setMainImagePath] = useState<string>(DEFAULT_RATING_IMAGE_PATH);

    useEffect(() => {
        if (!rating && !ratingHovered) {
            setMainImagePath(DEFAULT_RATING_IMAGE_PATH);
            return;
        }
        const imageName = ratingHovered
            ? RATING_IMAGES_MAP[ratingHovered]
            : RATING_IMAGES_MAP[rating];
        setMainImagePath(`${PATH_TO_RATING_IMAGES}${imageName}`);
    }, [rating, ratingHovered]);

    const closeModal = () => {
        authStore.closeRateModal();
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const { id } = e.target as HTMLDivElement;
        setRatingHovered(parseInt(id, 10));
    };

    const handleMouseLeave = () => {
        setRatingHovered(null);
    };

    const saveRating = (e: React.MouseEvent<HTMLDivElement>) => {
        const { id } = e.target as HTMLDivElement;
        setRating(parseInt(id, 10));
    };

    const confirmRate = () => {
        authStore.openConfirmRateModal();
        closeModal();
    };

    return (
        <Modal
            isOpen={showRateModal}
            className="modal rate-modal"
            shouldCloseOnOverlayClick
            overlayClassName="modal__overlay"
            onRequestClose={closeModal}
        >
            <button
                type="button"
                className="button button--icon modal__close-icon"
                onClick={closeModal}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
            <img
                src={mainImagePath}
                className="rate-modal__image"
                alt="rating"
            />
            <div className="modal__title">
                {reactTranslator.getMessage('popup_rate_modal_title')}
            </div>
            <div className="rate-modal__subtitle">
                {reactTranslator.getMessage('popup_rate_modal_subtitle')}
            </div>
            <div className="rate-modal__stars">
                {RATING_STARS.map((star) => (
                    <div
                        key={star}
                        id={star.toString()}
                        className={classnames(
                            'rate-modal__star',
                            { active: star <= (rating || 0) },
                        )}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={saveRating}
                    >
                        <Icon
                            icon="star"
                            className="rate-modal__star__icon"
                        />
                    </div>
                ))}
            </div>
            <button
                type="button"
                className="button button--medium button--medium--wide button--green rate-modal__button"
                onClick={confirmRate}
                disabled={!rating}
            >
                {reactTranslator.getMessage('popup_rate_modal_send_button')}
            </button>
            <button
                type="button"
                className="button button--medium button--medium--wide button--outline-secondary rate-modal__button"
                onClick={closeModal}
            >
                {reactTranslator.getMessage('popup_rate_modal_cancel_button')}
            </button>
        </Modal>
    );
});
