import React, { Component } from 'react';
import { observer } from 'mobx-react';
import './authentication.pcss';
import { authStore } from '../../stores';
import SocialIcons from './SocialIcons';
import SignInForm from './SignInForm';
import RegistrationForm from './RegistrationForm';

@observer
class Authentication extends Component {
    // TODO [maximtop] remove this method before publishing extension
    handleFakeAuthentication = async () => {
        await authStore.fakeAuthenticate();
    };

    getTitle = (step) => {
        const titleMaps = {
            signIn: 'Sign in',
            registration: 'Registration',
        };
        return titleMaps[step] || titleMaps.signIn;
    };

    getForm = (step) => {
        console.log(step);
        console.log(authStore.STEPS.REGISTRATION);
        if (step === authStore.STEPS.REGISTRATION) {
            return <RegistrationForm />;
        }
        return <SignInForm />;
    };

    render() {
        const { step } = authStore;
        return (
            <div className="sign-in">
                <div className="sign-in__header">
                    {step !== authStore.STEPS.SIGN_IN && (
                        <div
                            className="back"
                            role="button"
                            onClick={authStore.showSignIn}
                        >
                            back
                        </div>
                    )}
                    <h1
                        className="sign-in__title"
                        onClick={this.handleFakeAuthentication}
                    >
                        {this.getTitle(step)}
                    </h1>
                    {step === authStore.STEPS.SIGN_IN && <SocialIcons />}
                </div>
                {this.getForm(step)}
            </div>
        );
    }
}

export default Authentication;
