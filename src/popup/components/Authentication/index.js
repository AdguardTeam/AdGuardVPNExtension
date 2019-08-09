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
            signIn: 'Unlimited VPN',
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
            <div className="authentication">
                <div className="authentication__header">
                    {step === authStore.STEPS.SIGN_IN ? (
                        <div className="authentication__presentation">
                            Free
                        </div>
                    ) : (
                            <div
                                className="back"
                                role="button"
                                onClick={authStore.showSignIn}
                            >
                                back
                            </div>
                    )}
                    <div
                        className="authentication__title"
                        onClick={this.handleFakeAuthentication}
                    >
                        {this.getTitle(step)}
                    </div>
                    {step === authStore.STEPS.SIGN_IN && <SocialIcons title="Login to start:" />}
                </div>
                {this.getForm(step)}
            </div>
        );
    }
}

export default Authentication;
