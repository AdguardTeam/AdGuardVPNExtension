import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import rootStore from '../../../stores';
import { PASSWORD_RECOVERY_URL } from '../../../../background/config';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';

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

    const inputChangeHandler = async (e) => {
        const { target: { name, value } } = e;
        await authStore.onCredentialsChange(name, value);
    };

    const handleRegisterClick = async () => {
        await authStore.showRegistration('register');
    };

    const formClassName = classnames(
        'form form--login',
        { 'form--error': authStore.error }
    );

    return (
        <form
            className={formClassName}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__item">
                    <label className="form__label" htmlFor="username">
                        {reactTranslator.translate('auth_email')}
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
                            {reactTranslator.translate('auth_password')}
                        </label>
                        <a
                            href={PASSWORD_RECOVERY_URL}
                            className="button button--link form__link form__link--recover"
                            tabIndex="-1"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {reactTranslator.translate('auth_recover')}
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
                    {reactTranslator.translate('auth_login')}
                </button>

                <div className="form__text form__text--login">
                    {reactTranslator.translate('auth_account')}
                    &nbsp;
                    <button
                        onClick={handleRegisterClick}
                        type="button"
                        className="button button--link form__link form__link--register"
                    >
                        {reactTranslator.translate('auth_register')}
                    </button>
                </div>
            </div>
        </form>
    );
});

export default SignInForm;
