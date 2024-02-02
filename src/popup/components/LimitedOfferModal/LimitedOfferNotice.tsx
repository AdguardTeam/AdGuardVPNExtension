import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { timestampMsToTimeString } from '../../../common/promo-utils';
import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';

import './limited-offer-notice.pcss';

/**
 * Component to display limited offer notice.
 */
export const LimitedOfferNotice = observer(() => {
    const { uiStore, settingsStore } = useContext(rootStore);

    const { limitedOfferData } = settingsStore;

    if (!limitedOfferData) {
        return null;
    }

    const { timeLeftMs, discount } = limitedOfferData;

    /**
     * Opens limited offer details by changing the flag in the uiStore.
     */
    const openDetails = () => {
        uiStore.openLimitedOfferDetails();
    };

    return (
        <button
            type="button"
            className="limited-offer-notice"
            onClick={openDetails}
        >
            <svg className="icon icon--button limited-offer-notice__icon">
                <use xlinkHref="#fire" />
            </svg>

            <div className="limited-offer-notice__info">
                {reactTranslator.getMessage('popup_limited_offer_notice', {
                    discount,
                    time_left: `${timestampMsToTimeString(timeLeftMs)}`,
                    span: (chunks: string) => (<span className="limited-offer-notice__timer">{chunks}</span>),
                })}
            </div>
        </button>
    );
});
