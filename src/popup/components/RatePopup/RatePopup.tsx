import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { POPUP_STORE_URL, FEEDBACK_URL } from '../../../background/config';
import { reactTranslator } from '../../../common/reactTranslator';

import './rate.pcss';

const RATING_STARS = [5, 4, 3, 2, 1];

export const RatePopup = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        hideRate,
        isRateVisible,
    } = settingsStore;

    const handleHideRate = async () => {
        await hideRate();
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;

        // wait until the message is sent to the background and execute it before opening the new tab
        // because window.open() may close the popup and abort the message sending in some browsers
        // https://github.com/AdguardTeam/AdGuardVPNExtension/issues/150
        await handleHideRate();

        if (value && parseInt(value, 10) >= 4) {
            window.open(POPUP_STORE_URL, '_blank');
        } else {
            window.open(FEEDBACK_URL, '_blank');
        }

        // close popup after click on rate star
        window.close();
    };

    if (!isRateVisible) {
        return null;
    }

    return (
        <div className="rate-popup rate-popup--extra-option">
            <div className="rate-popup__text">
                {reactTranslator.getMessage('settings_rate_us')}
            </div>
            <div className="rate-popup__stars">
                {RATING_STARS.map((star) => (
                    <Fragment key={star}>
                        <input
                            type="radio"
                            value={star}
                            name="rating"
                            id={`rating-${star}`}
                            className="rate-popup__input"
                            onChange={handleChange}
                        />
                        <label
                            htmlFor={`rating-${star}`}
                            className="rate-popup__star"
                        />
                    </Fragment>
                ))}
            </div>
        </div>
    );
});
