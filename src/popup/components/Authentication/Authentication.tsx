import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { SignInForm } from './SignInForm';
import { Authorization } from './Authorization';
import { RegistrationForm } from './RegistrationForm';
import TwoFactorForm from './TwoFactorForm';
import { BackButton } from './BackButton';
import { PolicyAgreement } from './PolicyAgreement';

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
        };
        return titleMaps[step] || titleMaps.authorization;
    };

    const getForm = (step: string) => {
        switch (step) {
            case authStore.STEPS.REGISTRATION: {
                return <RegistrationForm />;
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
            default: {
                return <Authorization />;
            }
        }
    };

    const { step } = authStore;

    return (
        <div className="auth">
            <div className="auth__container">
                {getHeader(step)}
                {getForm(step)}
            </div>
        </div>
    );
});
