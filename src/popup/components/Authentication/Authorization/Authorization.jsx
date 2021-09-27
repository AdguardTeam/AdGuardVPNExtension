import React, { useContext } from 'react';
import { rootStore } from '../../../stores';

import { reactTranslator } from '../../../../common/reactTranslator';
import { AUTH_PROVIDERS } from '../../../../lib/constants';

import './authorization.pcss';

export const Authorization = () => {
    const { authStore } = useContext(rootStore);

    const authClickHandler = (provider) => async () => {
        await authStore.proceedAuthorization(provider);
    };

    return (
        <div className="authorization">
            <div className="authorization__title">
                {reactTranslator.getMessage('auth_title')}
            </div>
            <div className="authorization__info">
                {reactTranslator.getMessage('auth_info')}
            </div>
            <div className="authorization__container">
                {Object.values(AUTH_PROVIDERS).map((name) => (
                    <button
                        key={name}
                        type="button"
                        onClick={authClickHandler(name)}
                        className={`button button--outline-secondary button--medium authorization__button authorization__${name}`}
                    >
                        {reactTranslator.getMessage(`auth_sign_in_provider_${name}`)}
                    </button>
                ))}
            </div>
        </div>
    );
};
