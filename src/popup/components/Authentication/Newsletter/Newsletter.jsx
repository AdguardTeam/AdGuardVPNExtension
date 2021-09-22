import React, { useContext } from 'react';
import { rootStore } from '../../../stores';
import './newsletter.pcss';
import { reactTranslator } from '../../../../common/reactTranslator';

export const Newsletter = () => {
    const { authStore, settingsStore } = useContext(rootStore);

    const handleSubscribe = async () => {
        await authStore.setMarketingConsent(true);
        await settingsStore.setShowNewsletter(false);
    };

    const handleNoSubscribe = async () => {
        await authStore.setMarketingConsent(false);
        await settingsStore.setShowNewsletter(false);
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
                key="subscribe"
                type="button"
                onClick={handleSubscribe}
                className="button button--medium button--green newsletter__button-subscribe"
            >
                {reactTranslator.getMessage('popup_newsletter_subscribe')}
            </button>
            <button
                key="no-subscribe"
                type="button"
                onClick={handleNoSubscribe}
                className="button button--medium newsletter__button-no-subscribe"
            >
                {reactTranslator.getMessage('popup_newsletter_no_subscribe')}
            </button>
        </div>
    );
};
