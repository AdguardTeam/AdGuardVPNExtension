import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';
import './authentication.pcss';
import rootStore from '../../stores';
import SocialIcons from './SocialIcons';
import SignInForm from './SignInForm';
import RegistrationForm from './RegistrationForm';
import TwoFactorForm from './TwoFactorForm';

const Authentication = observer(() => {
    const { authStore } = useContext(rootStore);

    const getTitle = (step) => {
        const titleMaps = {
            signIn: (
                <Fragment>
                    <span className="authentication__presentation">
                        Free&nbsp;
                    </span>
                    <span>
                        Unlimited VPN
                    </span>
                </Fragment>
            ),
            registration: 'Registration',
            twoFactor: 'Confirmation',
        };
        return titleMaps[step] || titleMaps.signIn;
    };

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

    const handleBackClick = () => {
        authStore.showSignIn();
    };

    const { step } = authStore;
    return (
        <div className="authentication">
            <div className="authentication__header">
                {step !== authStore.STEPS.SIGN_IN && (
                    <button
                        className="button button--back"
                        role="button"
                        onClick={handleBackClick}
                    />
                )}
                <div
                    className="authentication__title"
                >
                    {getTitle(step)}
                </div>
                {step !== authStore.STEPS.TWO_FACTOR && (
                    <div className="authentication__privacy">
                        By continuing you accept the&nbsp;
                        <div>
                            <a href="#" className="authentication__privacy-link">
                                Terms and Conditions
                            </a>
                            &nbsp;and&nbsp;
                            <a href="#" className="authentication__privacy-link">
                                EULA
                            </a>
                        </div>
                    </div>
                )}
            </div>
            {getForm(step)}
            {step === authStore.STEPS.SIGN_IN && <SocialIcons />}
        </div>
    );
});

export default Authentication;
