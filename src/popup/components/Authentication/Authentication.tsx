import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import classNames from 'classnames';

import { rootStore } from '../../stores';

import { SignInForm } from './SignInForm';
import { Authorization } from './Authorization';
import { RegistrationForm } from './RegistrationForm';
import { TwoFactorForm } from './TwoFactorForm';
import { BackButton } from './BackButton';
import { PolicyAgreement } from './PolicyAgreement';
import { ScreenShot } from './ScreenShot';
import { ConfirmEmail } from './ConfirmEmail';

import './auth.pcss';

export const Authentication = observer(() => {
    const { authStore } = useContext(rootStore);

    const getHeader = (step: string) => {
        const titleMaps: { [key: string]: null | React.ReactElement } = {
            policyAgreement: null,
            authorization: null,
            signIn: <BackButton />,
            registration: <BackButton />,
            twoFactor: <BackButton />,
            confirmEmail: <BackButton />,
        };
        return titleMaps[step] || titleMaps.authorization;
    };

    const getForm = (step: string) => {
        switch (step) {
            case authStore.STEPS.REGISTRATION: {
                return <RegistrationForm />;
            }
            case authStore.STEPS.SCREENSHOT: {
                return <ScreenShot />;
            }
            case authStore.STEPS.TWO_FACTOR: {
                return <TwoFactorForm />;
            }
            case authStore.STEPS.AUTHORIZATION: {
                return <Authorization />;
            }
            case authStore.STEPS.SIGN_IN: {
                return <SignInForm />;
            }
            case authStore.STEPS.POLICY_AGREEMENT: {
                return <PolicyAgreement />;
            }
            case authStore.STEPS.CONFIRM_EMAIL: {
                return <ConfirmEmail />;
            }
            default: {
                return <Authorization />;
            }
        }
    };

    const { step } = authStore;

    const containerClassNames = classNames('auth__container', {
        'auth__container--agreement': step === authStore.STEPS.POLICY_AGREEMENT,
    });

    return (
        <div className="auth">
            <div className={containerClassNames}>
                {getHeader(step)}
                {getForm(step)}
            </div>
        </div>
    );
});
