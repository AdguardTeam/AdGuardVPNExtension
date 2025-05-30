import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../../background/config';
import { TelemetryActionName, TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { getForwarderUrl } from '../../../../common/helpers';
import { translator } from '../../../../common/translator';
import { rootStore } from '../../../stores';

import { RateStar } from './RateStar';

import './rate.pcss';

const RATING_STARS = [5, 4, 3, 2, 1];

export const Rate = observer(() => {
    const { settingsStore, telemetryStore } = useContext(rootStore);

    const {
        isRateVisible,
        forwarderDomain,
    } = settingsStore;

    const handleHideRate = async () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.SettingsHideRateUsClick,
            TelemetryScreenName.ContextBasedScreen,
        );
        await settingsStore.hideRate();
    };

    const handleChange = async (value: number) => {
        if (value < 0 || value > 5) {
            return;
        }

        telemetryStore.sendCustomEvent(
            TelemetryActionName.SettingsRateUsClick,
            TelemetryScreenName.ContextBasedScreen,
        );

        await handleHideRate();

        if (value >= 4) {
            window.open(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.OPTIONS_STORE), '_blank');
        } else {
            window.open(getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FEEDBACK), '_blank');
        }
    };

    if (!isRateVisible) {
        return null;
    }

    return (
        <div className="rate">
            <div className="rate__line" />
            <div className="rate__stars">
                {RATING_STARS.map((star) => (
                    <RateStar key={star} value={star} onChange={handleChange} />
                ))}
            </div>
            <div className="rate__title">
                {translator.getMessage('rate_description')}
            </div>
            <button
                type="button"
                className="rate__hide-btn has-tab-focus"
                onClick={handleHideRate}
            >
                {translator.getMessage('rate_hide')}
            </button>
        </div>
    );
});
