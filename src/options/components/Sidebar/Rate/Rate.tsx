import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../../background/config';
import { getForwarderUrl } from '../../../../common/helpers';
import { reactTranslator } from '../../../../common/reactTranslator';
import { rootStore } from '../../../stores';

import { RateStar } from './RateStar';

import './rate.pcss';

const RATING_STARS = [5, 4, 3, 2, 1];

export const Rate = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        isRateVisible,
        forwarderDomain,
    } = settingsStore;

    const handleHideRate = async (): Promise<void> => {
        await settingsStore.hideRate();
    };

    const handleChange = async (value: number): Promise<void> => {
        if (value < 0 || value > 5) {
            return;
        }

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
                {reactTranslator.getMessage('rate_description')}
            </div>
            <button
                type="button"
                className="rate__hide-btn"
                onClick={handleHideRate}
            >
                {reactTranslator.getMessage('rate_hide')}
            </button>
        </div>
    );
});
