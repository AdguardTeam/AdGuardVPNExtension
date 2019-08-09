import React, { Component } from 'react';
import { observer } from 'mobx-react';
import authStore from '../../../stores/authStore';
import Checkbox from '../../Settings/Checkbox';

@observer
class RegistrationForm extends Component {
    submitHandler = async (e) => {
        e.preventDefault();
        await authStore.register();
    };

    inputChangeHandler = (e) => {
        const { target: { name, value } } = e;
        authStore.onCredentialsChange(name, value);
    };

    render() {
        return (
            <form
                className="form"
                onSubmit={this.submitHandler}
            >
                {authStore.error
                && (
                    <div className="form__item-error">
                        {authStore.errorDescription}
                    </div>
                )}
                <div className="form__item">
                    <label className="form__label" htmlFor="username">
                        Email:
                    </label>
                    <input
                        id="username"
                        className="form__input"
                        type="text"
                        name="username"
                        placeholder="example@mail.com"
                        value={authStore.credentials.username}
                        onChange={this.inputChangeHandler}
                    />
                </div>
                <div className="form__item">
                    <div className="form__item-header">
                        <label className="form__label" htmlFor="password">
                            Password:
                        </label>
                    </div>
                    <input
                        id="password"
                        className="form__input"
                        type="password"
                        name="password"
                        onChange={this.inputChangeHandler}
                        value={authStore.credentials.password}
                    />
                </div>
                <div className="form__item">
                    <Checkbox
                        title="I agree to abide by AdGuard's Terms and Conditions"
                        id="agreement"
                        handler={this.inputChangeHandler}
                        value={authStore.credentials.agreement}
                    />
                </div>
                <div className="form__item">
                    <Checkbox
                        title="Do you allow us to send you infrequent updates on AdGuard? You can unsubscribe any time"
                        id="marketingConsent"
                        handler={this.inputChangeHandler}
                        value={authStore.credentials.marketingConsent}
                        mod="checkbox--grey"
                    />
                </div>

                <div className="form__btns">
                    <button
                        className="form__btn button button--m button--hundred button--green"
                        type="submit"
                    >
                        Register
                    </button>
                </div>
            </form>
        );
    }
}

export default RegistrationForm;
