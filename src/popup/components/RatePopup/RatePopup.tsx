import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { FORWARDER_URL_QUERIES } from '../../../background/config';
import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { reactTranslator } from '../../../common/reactTranslator';
import { navActions } from '../../../common/actions/navActions';
import { getForwarderUrl } from '../../../common/helpers';

import './rate.pcss';

const RATING_STARS = [5, 4, 3, 2, 1];

export const RatePopup = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);
    const {
        hideRate,
        isRateVisible,
        forwarderDomain,
    } = settingsStore;

    const handleHideRate = async (): Promise<void> => {
        await hideRate();
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const { value } = e.target;

        telemetryStore.sendCustomEvent(
            TelemetryActionName.RateUsClick,
            TelemetryScreenName.MenuScreen,
        );

        // wait until the message is sent to the background and execute it before opening the new tab
        // because window.open() may close the popup and abort the message sending in some browsers
        // https://github.com/AdguardTeam/AdGuardVPNExtension/issues/150
        await handleHideRate();

        if (value && parseInt(value, 10) >= 4) {
            await navActions.openWindow(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.OPTIONS_STORE));
        } else {
            await navActions.openWindow(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FEEDBACK));
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
