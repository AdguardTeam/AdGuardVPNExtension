import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';

import rootStore from '../../../stores';
import { PASSWORD_RECOVERY_URL } from '../../../../background/config';

const SignInForm = observer(() => {
    const { authStore } = useContext(rootStore);
    const { error, credentials, disableLogin } = authStore;
    const { username, password } = credentials;

    useEffect(() => {
        (async () => {
            await authStore.getAuthCacheFromBackground();
        })();
    }, []);

    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.authenticate();
    };

    const inputChangeHandler = (e) => {
        const { target: { name, value } } = e;
        authStore.onCredentialsChange(name, value);
    };

    const handleRegisterClick = () => {
        authStore.showRegistration('register');
    };

    return (
        <form
            className={`form form--login${authStore.error && ' form--error'}`}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__item">
                    <label className="form__label" htmlFor="username">
                        {browser.i18n.getMessage('auth_email')}
                    </label>
                    <input
                        id="username"
                        className="form__input"
                        type="text"
                        name="username"
                        placeholder="example@mail.com"
                        value={username}
                        onChange={inputChangeHandler}
                    />
                </div>
                <div className="form__item">
                    <div className="form__item-header">
                        <label className="form__label" htmlFor="password">
                            {browser.i18n.getMessage('auth_password')}
                        </label>
                        <a
                            href={PASSWORD_RECOVERY_URL}
                            className="button button--link form__link form__link--recover"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {browser.i18n.getMessage('auth_recover')}
                        </a>
                    </div>
                    <input
                        id="password"
                        className="form__input"
                        type="password"
                        name="password"
                        onChange={inputChangeHandler}
                        value={password}
                    />
                </div>
                {error && (
                    <div className="form__error">
                        {error}
                    </div>
                )}
            </div>
            <div className="form__actions">
                <button
                    type="submit"
                    className="button button--primary button--medium button--block"
                    disabled={disableLogin}
                >
                    {browser.i18n.getMessage('auth_login')}
                </button>

                <div className="form__text form__text--login">
                    {browser.i18n.getMessage('auth_account')}
                    &nbsp;
                    <button
                        onClick={handleRegisterClick}
                        type="button"
                        className="button button--link form__link form__link--register"
                    >
                        {browser.i18n.getMessage('auth_register')}
                    </button>
                </div>
            </div>
        </form>
    );
});

export default SignInForm;
