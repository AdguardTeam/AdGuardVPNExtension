import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';

import translator from '../../../../lib/translator';
import rootStore from '../../../stores';
import { REQUEST_STATUSES } from '../../../stores/consts';

import Submit from '../Submit';
import InputField from '../InputField';

const CheckEmail = observer(() => {
    const { authStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await authStore.getAuthCacheFromBackground();
        })();
    }, []);

    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.checkEmail();
    };

    const inputChangeHandler = async (e) => {
        const { target: { name, value } } = e;
        await authStore.onCredentialsChange(name, value);
    };

    const openSignInCheck = async () => {
        await authStore.openSignInCheck();
    };

    const openSignUpCheck = async () => {
        await authStore.openSignUpCheck();
    };

    let params = {
        buttonText: 'auth_sign_up',
        linkText: 'auth_sign_in_link',
        linkEvent: openSignInCheck,
    };

    if (authStore.signInCheck) {
        params = {
            buttonText: 'auth_sign_in',
            linkText: 'auth_sign_up',
            linkEvent: openSignUpCheck,
        };
    }

    const getSubmitButton = () => {
        const { requestProcessState, credentials } = authStore;
        const { username } = credentials;

        return (
            <>
                <div className="form__btn-wrap">
                    <Submit
                        text={translator.translate(params.buttonText)}
                        processing={requestProcessState === REQUEST_STATUSES.PENDING}
                        disabled={!username}
                    />
                </div>

                <button
                    type="button"
                    className="button button--inline form__link"
                    onClick={params.linkEvent}
                >
                    {translator.translate(params.linkText)}
                </button>
            </>
        );
    };

    const { credentials: { username } } = authStore;

    return (
        <form
            className="form form--login"
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__subtitle">
                    {translator.translate(params.buttonText)}
                </div>
                <InputField
                    id="username"
                    type="email"
                    value={username}
                    placeholder={translator.translate('auth_email')}
                    inputChangeHandler={inputChangeHandler}
                    error={authStore.error}
                />
                {authStore.error && (
                    <div className="form__error">
                        {ReactHtmlParser(authStore.error)}
                    </div>
                )}
            </div>

            {getSubmitButton()}
        </form>
    );
});

export default CheckEmail;
