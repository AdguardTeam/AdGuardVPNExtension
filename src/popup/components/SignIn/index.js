import React, { Component } from 'react';
import './sign-in.pcss';
import settingsStore from '../../stores/settingsStore';
import SocialIcons from './SocialIcons';
import SignInForm from './SignInForm';

class SignIn extends Component {
    // handleSubmit = (e) => {
    //     console.log(e);
    // };

    // TODO remove this method after sign in
    handleFakeSignIn = () => {
        settingsStore.setSignedIn(true);
    };

    render() {
        return (
            <div className="sign-in">
                <div className="sign-in__header">
                    <h1
                        className="sign-in__title"
                        onClick={this.handleFakeSignIn}
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
