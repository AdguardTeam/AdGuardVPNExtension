import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';

import { STORE_URL, FEEDBACK_URL } from '../../../../background/config';
import rootStore from '../../../stores';
import './rate.pcss';

const RATING_STARS = [5, 4, 3, 2, 1];

const Rate = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        hideRate,
        isRateVisible,
    } = settingsStore;

    const handleHideRate = async () => {
        await hideRate();
    };

    const handleChange = (e) => {
        const { value } = e.target;

        if (value && parseInt(value, 10) >= 4) {
            window.open(STORE_URL, '_blank');
        } else {
            window.open(FEEDBACK_URL, '_blank');
        }
    };

    return (
        <>
            {isRateVisible ? (
                <div className="rate">
                    <div className="rate__text">
                        {browser.i18n.getMessage('rate_description')}
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
                        {browser.i18n.getMessage('rate_hide')}
                    </button>
                </div>
            ) : ''}
        </>
    );
});

export default Rate;
