import React from 'react';
import { UNLIMITED_FEATURES } from '../../../../common/components/constants';
import { reactTranslator } from '../../../../common/reactTranslator';
import { Title } from '../../ui/Title';

import './features.pcss';

export const Features = () => {
    return (
        <div className="features">
            <Title title={reactTranslator.getMessage('account_unlimited_title')} />
            <div className="features__list">
                {UNLIMITED_FEATURES.map((feature) => {
                    const { image, title, info } = feature;

                    return (
                        <div key={title as string} className="features__item">
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
