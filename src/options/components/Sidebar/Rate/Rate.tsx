import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';

import { FORWARDER_URL_QUERIES } from '../../../../background/config';
import { getForwarderUrl } from '../../../../common/helpers';
import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

import './rate.pcss';

const RATING_STARS = [5, 4, 3, 2, 1];

export const Rate = observer(() => {
    const { settingsStore } = useContext(rootStore);
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

        await handleHideRate();

        if (value && parseInt(value, 10) >= 4) {
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
            <div className="rate__text">
                {reactTranslator.getMessage('rate_description')}
            </div>
            <div className="rate__stars">
                {RATING_STARS.map((star) => (
                    <Fragment key={star}>
                        <input
                            type="radio"
                            value={star}
                            name="rating"
                            id={`rating-${star}`}
                            className="rate__input"
                            onChange={handleChange}
                        />
                        <label
                            htmlFor={`rating-${star}`}
                            className="rate__star"
                        />
                    </Fragment>
                ))}
            </div>
            <button
                type="button"
                className="rate__hide"
                onClick={handleHideRate}
            >
                {reactTranslator.getMessage('rate_hide')}
            </button>
        </div>
    );
});
