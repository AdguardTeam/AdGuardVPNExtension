import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { AUTH_PROVIDERS } from '../../../../lib/constants';
import Icon from '../../ui/Icon';

import './authorization.pcss';

export const Authorization = () => {
    const { authStore } = useContext(rootStore);

    const authClickHandler = (provider) => async () => {
        await authStore.proceedAuthorization(provider);
    };

    const providersData = {};
    Object.values(AUTH_PROVIDERS).forEach((provider) => {
        providersData[provider] = `auth_sign_in_provider_${provider}`;
    });

    return (
        <div className="authorization">
            <div className="authorization__title">
                {reactTranslator.getMessage('auth_title')}
            </div>
            <div className="authorization__info">
                {reactTranslator.getMessage('auth_info')}
            </div>
            <div className="authorization__container">
                {Object.keys(providersData).map((provider) => (
                    <button
                        key={provider}
                        type="button"
                        onClick={authClickHandler(provider)}
                        className={`button button--outline-secondary button--medium authorization__button authorization__${provider}`}
                    >
                        <Icon icon={`auth_icon_${provider}`} className="authorization__button__social-icon" />
                        {reactTranslator.getMessage(providersData[provider])}
                    </button>
                ))}
            </div>
        </div>
    );
};
