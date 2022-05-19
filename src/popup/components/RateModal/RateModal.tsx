import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../stores';
import { PATH_TO_RATING_IMAGES, RATING_IMAGES_MAP } from './constants';

import './rate-modal.pcss';

const RATING_STARS = [5, 4, 3, 2, 1];

const DEFAULT_RATING_IMAGE = RATING_IMAGES_MAP[0];
const DEFAULT_RATING_IMAGE_PATH = `${PATH_TO_RATING_IMAGES}${DEFAULT_RATING_IMAGE}`;

export const RateModal = observer(() => {
    const { uiStore } = useContext(rootStore);

    const { rating, setRating, isRateModalVisible } = uiStore;

    const [ratingHovered, setRatingHovered] = useState<number | null>(null);
    const [mainImagePath, setMainImagePath] = useState<string>(DEFAULT_RATING_IMAGE_PATH);

    useEffect(() => {
        const imageName = ratingHovered
            ? RATING_IMAGES_MAP[ratingHovered]
            : RATING_IMAGES_MAP[rating];
        setMainImagePath(`${PATH_TO_RATING_IMAGES}${imageName}`);
    });

    const closeModal = () => {
        uiStore.closeRateModal();
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const { id } = e.target as HTMLDivElement;
        setRatingHovered(parseInt(id, 10));
    };

    const handleMouseLeave = () => {
        setRatingHovered(0);
    };

    const saveRating = (e: React.MouseEvent<HTMLDivElement>) => {
        const { id } = e.target as HTMLDivElement;
        setRating(parseInt(id, 10));
    };

    const confirmRate = () => {
        uiStore.openConfirmRateModal();
        closeModal();
    };

    return (
        <Modal
            isOpen={isRateModalVisible}
            className="rate-modal"
            shouldCloseOnOverlayClick
            overlayClassName="rate-modal__overlay"
            onRequestClose={closeModal}
        >
            <button
                type="button"
                className="button button--icon rate-modal__close-icon"
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
            <div className="rate-modal__title">How awesome is AdGuard VPN?</div>
            <div className="rate-modal__subtitle">Please rate us</div>
            <div className="rate-modal__stars">
                {RATING_STARS.map((star) => (
                    <div
                        key={star}
                        id={star.toString()}
                        className={classnames(
                            'rate-modal__star',
                            { active: star <= rating },
                        )}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={saveRating}
                    />
                ))}
            </div>
            <button
                type="button"
                className="button button--medium button--green rate-modal__button"
                onClick={confirmRate}
                disabled={!rating}
            >
                Send
            </button>
            <button
                type="button"
                className="button button--medium button--outline-secondary rate-modal__button"
                onClick={closeModal}
            >
                Cancel
            </button>
        </Modal>
    );
});
