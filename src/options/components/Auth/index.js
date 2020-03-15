import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';

import rootStore from '../../stores';
import SocialAuth from './SocialAuth';
import SignInForm from './SignInForm';
import RegistrationForm from './RegistrationForm';
import TwoFactorForm from './TwoFactorForm';
import Terms from './Terms';

import './auth.pcss';

const Authentication = observer(() => {
    const { authStore } = useContext(rootStore);

    const getForm = (step) => {
        switch (step) {
            case authStore.STEPS.REGISTRATION: {
                return <RegistrationForm />;
            }
            case authStore.STEPS.TWO_FACTOR: {
                return <TwoFactorForm />;
            }
            default: {
                return <SignInForm />;
            }
        }
    };

    const { step } = authStore;

    return (
        <div className="auth">
            <div className="auth__container">
                <div className="auth__column">
                    <svg className="auth__logo">
                        <use xlinkHref="#logo" />
                    </svg>
                    <svg className="auth__beta">
                        <use xlinkHref="#beta" />
                    </svg>

                    <h2 className="auth__title">
                        {browser.i18n.getMessage('auth_title')}
                    </h2>

                    <p className="auth__description">
                        {browser.i18n.getMessage('auth_description')}
                    </p>
                </div>
                <div className="auth__column">
                    <div className="auth__content">
                        {step !== authStore.STEPS.TWO_FACTOR && (
                            <Terms />
                        )}
                        {getForm(step)}
                        {step === authStore.STEPS.SIGN_IN && <SocialAuth />}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default Authentication;
