import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';

import { SocialAuth } from './SocialAuth';
import SignInForm from './SignInForm';
import { RegistrationForm } from './RegistrationForm';
import TwoFactorForm from './TwoFactorForm';
import CheckEmail from './CheckEmail';
import { BackButton } from './BackButton';

import './auth.pcss';

const Authentication = observer(() => {
    const { authStore } = useContext(rootStore);

    const getHeader = (step) => {
        const titleMaps = {
            checkEmail: null,
            signIn: <BackButton />,
            registration: <BackButton />,
            twoFactor: <BackButton />,
        };
        return titleMaps[step] || titleMaps.checkEmail;
    };

    const getForm = (step) => {
        switch (step) {
            case authStore.STEPS.REGISTRATION: {
                return <RegistrationForm />;
            }
            case authStore.STEPS.TWO_FACTOR: {
                return <TwoFactorForm />;
            }
            case authStore.STEPS.SIGN_IN: {
                return <SignInForm />;
            }
            default: {
                return <CheckEmail />;
            }
        }
    };

    const { step } = authStore;

    const renderSocialAuth = () => {
        if (step === authStore.STEPS.CHECK_EMAIL) {
            return <SocialAuth />;
        }

        return null;
    };

    return (
        <div className="auth">
            <div className="auth__container">
                {getHeader(step)}
                {getForm(step)}
                {renderSocialAuth()}
            </div>
        </div>
    );
});

export default Authentication;
