import React, { Component } from 'react';
import './sign-in.pcss';
import { authStore } from '../../stores';
import SocialIcons from './SocialIcons';
import SignInForm from './SignInForm';

class SignIn extends Component {
    // TODO [maximtop] remove this method before publishing extension
    handleFakeAuthentication = async () => {
        await authStore.fakeAuthenticate();
    };

    render() {
        return (
            <div className="sign-in">
                <div className="sign-in__header">
                    <h1
                        className="sign-in__title"
                        onClick={this.handleFakeAuthentication}
                    >
                        Sign in
                    </h1>
                    <SocialIcons />
                </div>
                <SignInForm />
            </div>
        );
    }
}

export default SignIn;
