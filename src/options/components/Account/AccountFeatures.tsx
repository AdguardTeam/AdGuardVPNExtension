import React from 'react';

import { UNLIMITED_FEATURES } from '../../../common/components/constants';
import { translator } from '../../../common/translator';
import { Title } from '../ui/Title';

export function AccountFeatures() {
    return (
        <div className="account__features-wrapper">
            <Title
                title={translator.getMessage('account_unlimited_title')}
                size="medium"
            />
            <div className="account__features-list">
                {UNLIMITED_FEATURES.map((feature) => {
                    const { image, title, info } = feature;

                    return (
                        <div key={title} className="account__features-item">
                            <img
                                src={`../../../assets/images/${image}`}
                                className="account__features-image"
                                alt="slide"
                            />
                            <div className="account__features-content">
                                <div className="account__features-title">
                                    {title}
                                </div>
                                <div className="account__features-desc">
                                    {info}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
