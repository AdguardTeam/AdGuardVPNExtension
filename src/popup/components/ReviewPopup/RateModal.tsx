import React, { useContext, useEffect, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { Icon, IconButton } from '../../../common/components/Icons';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';

import { RATING_IMAGES_MAP } from './constants';

import './rate-modal.pcss';

const RATING_STARS = [5, 4, 3, 2, 1];

const DEFAULT_RATING_IMAGE_URL = RATING_IMAGES_MAP[5];

export const RateModal = observer(() => {
    const { authStore, telemetryStore } = useContext(rootStore);

    const { rating, setRating, showRateModal } = authStore;

    const [ratingHovered, setRatingHovered] = useState<number | null>(null);
    const [mainImagePath, setMainImagePath] = useState<string>(DEFAULT_RATING_IMAGE_URL);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogRateUs,
        showRateModal,
    );

    useEffect(() => {
        if (!rating && !ratingHovered) {
            setMainImagePath(DEFAULT_RATING_IMAGE_URL);
            return;
        }
        const imageUrl = ratingHovered
            ? RATING_IMAGES_MAP[ratingHovered]
            : RATING_IMAGES_MAP[rating];
        setMainImagePath(imageUrl);
    }, [rating, ratingHovered]);

    const closeModal = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.CancelRateUsClick,
            TelemetryScreenName.DialogRateUs,
        );
        authStore.closeRateModal();
    };

    const handleMouseEnter = (e: React.BaseSyntheticEvent): void => {
        const { id } = e.target;
        setRatingHovered(parseInt(id, 10));
    };

    const handleMouseLeave = (): void => {
        setRatingHovered(null);
    };

    const saveRating = (e: React.BaseSyntheticEvent): void => {
        const { id } = e.target;
        setRating(parseInt(id, 10));
    };

    const confirmRate = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SendRateUsClick,
            TelemetryScreenName.DialogRateUs,
        );
        authStore.openConfirmRateModal();
    };

    return (
        <Modal
            isOpen={showRateModal}
            className="modal rate-modal"
            shouldCloseOnOverlayClick
            overlayClassName="modal__overlay"
            onRequestClose={closeModal}
        >
            <IconButton
                name="cross"
                className="close-icon-btn"
                onClick={closeModal}
            />
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
                        <Icon name="star-rounded" className="rate-modal__star__icon" />
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
