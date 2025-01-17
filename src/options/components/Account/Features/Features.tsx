import React from 'react';

import { UNLIMITED_FEATURES } from '../../../../common/components/constants';
import { translator } from '../../../../common/translator';
import { Title } from '../../ui/Title';

import './features.pcss';

export const Features = () => {
    return (
        <div className="features">
            <Title
                title={translator.getMessage('account_unlimited_title')}
                size="medium"
                className="features__title"
            />
            <div className="features__list">
                {UNLIMITED_FEATURES.map((feature) => {
                    const { image, title, info } = feature;

                    return (
                        <div key={title} className="features__item">
                            <img
                                src={`../../../../assets/images/${image}`}
                                className="features__image"
                                alt="slide"
                            />
                            <div className="features__content">
                                <div className="features__title">
                                    {title}
                                </div>
                                <div className="features__desc">
                                    {info}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
