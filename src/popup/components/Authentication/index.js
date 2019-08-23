import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';
import './authentication.pcss';
import rootStore from '../../stores';
import SocialIcons from './SocialIcons';
import SignInForm from './SignInForm';
import RegistrationForm from './RegistrationForm';

const Authentication = observer(() => {
    const { authStore } = useContext(rootStore);
    // TODO [maximtop] remove this method before publishing extension
    const handleFakeAuthentication = async () => {
        await authStore.fakeAuthenticate();
    };

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
        };
        return titleMaps[step] || titleMaps.signIn;
    };

    const getForm = (step) => {
        if (step === authStore.STEPS.REGISTRATION) {
            return <RegistrationForm />;
        }
        return <SignInForm />;
    };

    const handleBackClick = () => {
        authStore.showSignIn();
        authStore.setDefaultsError();
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
                    onClick={handleFakeAuthentication}
                >
                    {getTitle(step)}
                </div>
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
            </div>
            {getForm(step)}
            {step === authStore.STEPS.SIGN_IN && <SocialIcons />}
        </div>
    );
});

export default Authentication;
