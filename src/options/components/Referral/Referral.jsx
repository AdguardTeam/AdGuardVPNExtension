import React from 'react';

import { reactTranslator } from '../../../common/reactTranslator';

import './referral.pcss';
import { Title } from '../ui/Title';

export const Referral = () => {
    return (
        <div className="referral">
            <img
                src="../../../assets/images/free-traffic.svg"
                className="referral__image"
                alt="Get free traffic"
            />
            <Title title={reactTranslator.getMessage('referral_get_free_traffic')} />
            <div className="referral__info">
                {reactTranslator.getMessage('settings_referral_info')}
            </div>
        </div>
    );
};
