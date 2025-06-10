import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { timestampMsToTimeString } from '../../../common/utils/promo';
import { reactTranslator } from '../../../common/reactTranslator';
import { Icon } from '../../../common/components/Icons';
import { rootStore } from '../../stores';

import './limited-offer-notice.pcss';

/**
 * Component to display limited offer notice.
 */
export const LimitedOfferNotice = observer(() => {
    const { uiStore, settingsStore, telemetryStore } = useContext(rootStore);

    const { limitedOfferData } = settingsStore;

    if (!limitedOfferData) {
        return null;
    }

    const { timeLeftMs, discount } = limitedOfferData;

    /**
     * Opens limited offer details by changing the flag in the uiStore.
     */
    const openDetails = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.PromoOfferClick,
            TelemetryScreenName.HomeScreen,
        );
        uiStore.openLimitedOfferDetails();
    };

    return (
        <button
            type="button"
            className="limited-offer-notice"
            onClick={openDetails}
        >
            <Icon name="fire" className="limited-offer-notice__icon" />

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
