import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';

import { STORE_URL } from '../../../../background/config';
import rootStore from '../../../stores';
import './rate.pcss';

const RATING_STARS = [1, 2, 3, 4, 5];

const Rate = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const {
        hideRate,
        isRateVisible,
    } = settingsStore;

    const handleHideRate = () => {
        hideRate();
    };

    const handleClick = () => {
        window.open(STORE_URL, '_blank');
    };

    return (
        <Fragment>
            {isRateVisible ? (
                <div className="rate">
                    <div className="rate__text">
                        {browser.i18n.getMessage('rate_description')}
                    </div>
                    <div className="rate__stars">
                        {RATING_STARS.map(star => (
                            <Fragment key={star}>
                                <input
                                    type="radio"
                                    value={star}
                                    name="rating"
                                    id={`rating-${star}`}
                                    className="rate__input"
                                />
                                <label
                                    htmlFor={`rating-${star}`}
                                    className="rate__star"
                                    onClick={handleClick}
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
        </Fragment>
    );
});

export default Rate;
