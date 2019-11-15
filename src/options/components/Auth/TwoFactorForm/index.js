import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';

import rootStore from '../../../stores';

const TwoFactorForm = observer(() => {
    const { authStore } = useContext(rootStore);
    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.authenticate();
    };

    const inputChangeHandler = (e) => {
        const { target: { name, value } } = e;
        authStore.onCredentialsChange(name, value);
    };

    return (
        <form
            className={`form${authStore.error && ' form--error'}`}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__item">
                    <label className="form__label" htmlFor="twoFactor">
                        {browser.i18n.getMessage('auth_code')}
                    </label>
                    <input
                        id="twoFactor"
                        className="form__input"
                        type="text"
                        name="twoFactor"
                        placeholder="Enter the verification code"
                        value={authStore.credentials.twoFactor}
                        onChange={inputChangeHandler}
                    />
                </div>
                {authStore.error && (
                    <div className="form__error">
                        {authStore.error}
                    </div>
                )}
            </div>

            <div className="form__actions">
                <button
                    className="button button--primary button--block button--medium"
                    type="submit"
                >
                    {browser.i18n.getMessage('auth_confirm')}
                </button>
            </div>
        </form>
    );
});

export default TwoFactorForm;
