import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';

import './newsletter.pcss';

export var Newsletter = function () {
    const { authStore } = useContext(rootStore);

    const handleClick = (value) => async () => {
        await authStore.setMarketingConsent(value);
    };

    return (
        <div className="newsletter">
            <img
                src="../../../../assets/images/newsletter.svg"
                className="newsletter__image"
                alt="newsletter"
            />
            <div className="newsletter__title">
                {reactTranslator.getMessage('popup_newsletter_title')}
            </div>
            <div className="newsletter__info">
                {reactTranslator.getMessage('popup_newsletter_info')}
            </div>
            <button
                type="button"
                onClick={handleClick(true)}
                className="button button--medium button--green newsletter__button-subscribe"
            >
                {reactTranslator.getMessage('popup_newsletter_subscribe')}
            </button>
            <button
                type="button"
                onClick={handleClick(false)}
                className="button button--medium newsletter__button-skip"
            >
                {reactTranslator.getMessage('popup_newsletter_no_subscribe')}
            </button>
        </div>
    );
};
