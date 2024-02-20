import React, { useContext } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import { UNLIMITED_FEATURES } from '../../../common/components/constants';
import { timestampMsToTimeString } from '../../../common/utils/promo';
import { reactTranslator } from '../../../common/reactTranslator';
import { popupActions } from '../../actions/popupActions';
import { rootStore } from '../../stores';

import './limited-offer-details.pcss';

/**
 * Component for displaying limited offer details.
 */
export const LimitedOfferDetails = observer(() => {
    const { uiStore, settingsStore } = useContext(rootStore);

    const { shouldShowLimitedOfferDetails } = uiStore;

    const { limitedOfferData } = settingsStore;

    if (!limitedOfferData) {
        return null;
    }

    const {
        timeLeftMs,
        years,
        discount,
        url,
    } = limitedOfferData;

    const openLimitedOfferLink = () => {
        popupActions.openTab(url);
    };

    /**
     * Closes the limited offer details and shows the notice again
     * by changing the flags in the **uiStore**.
     */
    const closeDetails = () => {
        uiStore.closeLimitedOfferDetails();
        // show the notice again as it cannot be hidden manually, hide only it timer is over
        uiStore.openLimitedOfferNotice();
    };

    return (
        <Modal
            isOpen={shouldShowLimitedOfferDetails}
            className="modal modal--fullscreen limited-offer-details"
            shouldCloseOnOverlayClick
            overlayClassName="modal__overlay"
            onRequestClose={closeDetails}
        >
            <div className="limited-offer-details__content">

                <div className="limited-offer-details__image">
                    <button
                        type="button"
                        className="button button--icon limited-offer-details__close-icon"
                        onClick={closeDetails}
                    >
                        <svg className="icon icon--button icon--cross-gray7f">
                            <use xlinkHref="#cross" />
                        </svg>
                    </button>
                </div>

                <div className="limited-offer-details__header">
                    <div className="modal__title modal__title--fullscreen modal__title--fullscreen--time-left limited-offer-details__time-left">
                        {reactTranslator.getMessage('popup_limited_offer_details_time_left', {
                            time_left: `${timestampMsToTimeString(timeLeftMs)}`,
                        })}
                    </div>

                    <div className="modal__title modal__title--fullscreen limited-offer-details__title">
                        {reactTranslator.getPlural('popup_limited_offer_details_title', years, {
                            discount,
                            span: (chunks: string) => {
                                return (<span className="limited-offer-details__title--discount">{chunks}</span>);
                            },
                        })}
                    </div>
                </div>

                <div>
                    {UNLIMITED_FEATURES.map((feature) => {
                        const { image, title, info } = feature;
                        return (
                            <div key={title} className="limited-offer-details__features-item">
                                <img
                                    src={`../../../assets/images/${image}`}
                                    className="limited-offer-details__features-image"
                                    alt="slide"
                                />
                                <div className="features__content">
                                    <div className="limited-offer-details__features-title">
                                        {title}
                                    </div>
                                    <div className="limited-offer-details__features-desc">
                                        {info}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="limited-offer-details__footer">
                <button
                    type="button"
                    className="button button--pink-red limited-offer-details__button"
                    onClick={openLimitedOfferLink}
                >
                    {reactTranslator.getMessage('popup_limited_offer_details_btn')}
                </button>
            </div>
        </Modal>
    );
});
