import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { STORE_URL, FEEDBACK_URL } from '../../../../background/config';
import rootStore from '../../../stores';
import './rate.pcss';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

const RATING_STARS = [5, 4, 3, 2, 1];

const Rate = observer(({ title, sidebar }) => {
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

    const rateClassNames = classnames(
        'rate',
        { 'rate--extra-option': !sidebar}
    );

    return (
        <>
            {isRateVisible ? (
                <div className={rateClassNames}>
                    <div className="rate__text">
                        { title }
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
                    {sidebar && (
                        <button
                            type="button"
                            className="rate__hide"
                            onClick={handleHideRate}
                        >
                            {reactTranslator.translate('rate_hide')}
                        </button>
                    )}
                </div>
            ) : ''}
        </>
    );
});

export default Rate;
