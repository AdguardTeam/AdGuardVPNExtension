import React, { Component } from 'react';
import './sign-in.pcss';
import settingsStore from '../../stores/settingsStore';

class SignIn extends Component {
    handleSubmit = (e) => {
        console.log(e);
    };

    // TODO remove this method after sign in
    handleFakeSignIn = () => {
        settingsStore.setSignedIn(true);
    };

    render() {
        return (
            <div className="sign_in">
                <h1 onClick={this.handleFakeSignIn}>Sign in</h1>
                <div className="social-icons">
                    <div className="twitter" />
                    <div className="google" />
                    <div className="yandex" />
                    <div className="vk" />
                </div>
                <form className="form" onSubmit={this.handleSubmit}>
                    <label htmlFor="email">
                        Email:
                        <input type="text" name="email" placeholder="example@mail.com" />
                    </label>
                    <label htmlFor="password">
                        Password:
                        <input type="text" name="password" />
                    </label>
                    <input type="submit" value="Submit" />
                    <div>Register</div>
                </form>
            </div>
        );
    }
}

export default SignIn;
