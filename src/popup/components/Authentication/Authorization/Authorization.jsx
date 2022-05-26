import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { AUTH_PROVIDERS } from '../../../../lib/constants';
import { EmailAuth } from '../EmailAuth';
import Icon from '../../ui/Icon';

import './authorization.pcss';

export const Authorization = () => {
    const { authStore } = useContext(rootStore);

    const authClickHandler = (provider) => async () => {
        await authStore.proceedAuthorization(provider);
    };

    const providersTranslations = {
        [AUTH_PROVIDERS.APPLE]: reactTranslator.getMessage('auth_sign_in_provider_apple'),
        [AUTH_PROVIDERS.GOOGLE]: reactTranslator.getMessage('auth_sign_in_provider_google'),
        [AUTH_PROVIDERS.FACEBOOK]: reactTranslator.getMessage('auth_sign_in_provider_facebook'),
    };

    return (
        <div className="authorization">
            <div className="authorization__title">
                {reactTranslator.getMessage('auth_title')}
            </div>
            <div className="authorization__container">
                <EmailAuth />
                <div className="authorization__bottom-row" />
                {Object.values(AUTH_PROVIDERS).map((provider) => (
                    <button
                        key={provider}
                        type="button"
                        onClick={authClickHandler(provider)}
                        className="button button--outline-secondary button--medium authorization__button"
                    >
                        <Icon icon={`auth_icon_${provider}`} className="authorization__button__social-icon" />
                        {providersTranslations[provider]}
                    </button>
                ))}
            </div>
        </div>
    );
};
