import React, { useContext } from 'react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
import { SocialAuthProvider } from '../../../../common/constants';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { TelemetryScreenName } from '../../../../background/telemetry';
import { EmailAuth } from '../EmailAuth';
import { Icon } from '../../ui/Icon';

import './authorization.pcss';

export const Authorization = () => {
    const { authStore, telemetryStore, settingsStore } = useContext(rootStore);
    const { showServerErrorPopup } = settingsStore;

    const canSendTelemetry = !showServerErrorPopup; // `DialogCantConnect` is rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.AuthLoginScreen1,
        canSendTelemetry,
    );

    const authClickHandler = (provider: SocialAuthProvider) => async () => {
        await authStore.proceedAuthorization(provider);
    };

    const providersTranslations: { [key: string]: React.ReactNode } = {
        [SocialAuthProvider.Apple]: reactTranslator.getMessage('auth_sign_in_provider_apple'),
        [SocialAuthProvider.Google]: reactTranslator.getMessage('auth_sign_in_provider_google'),
        [SocialAuthProvider.Facebook]: reactTranslator.getMessage('auth_sign_in_provider_facebook'),
    };

    return (
        <div className="authorization">
            <div className="authorization__title">
                {reactTranslator.getMessage('auth_title')}
            </div>
            <div className="authorization__container">
                <EmailAuth />
                <div className="authorization__bottom-row" />
                {Object.values(SocialAuthProvider).map((provider) => (
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
