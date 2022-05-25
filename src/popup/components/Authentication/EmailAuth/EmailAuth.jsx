import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { REQUEST_STATUSES } from '../../../stores/consts';

import Submit from '../Submit';
import InputField from '../InputField';
import { reactTranslator } from '../../../../common/reactTranslator';

export const EmailAuth = observer(() => {
    const { authStore } = useContext(rootStore);

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

    const formClassName = classnames(
        'form form--login',
        { 'form--error': authStore.error },
    );

    let params = {
        titleText: 'auth_sign_up',
        infoText: 'auth_header_sign_up_create_account',
        buttonText: 'auth_sign_up_button',
        linkText: 'auth_sign_in_link',
        linkEvent: openSignInCheck,
    };

    if (authStore.signInCheck) {
        params = {
            titleText: 'auth_sign_in',
            infoText: 'auth_header_sign_in_account',
            buttonText: 'auth_sign_in_button',
            linkText: 'auth_sign_up',
            linkEvent: openSignUpCheck,
        };
    }

    const getSubmitButton = () => {
        const { requestProcessState, credentials } = authStore;
        const { username } = credentials;

        return (
            <div className="form__btn-wrap">
                <Submit
                    text={reactTranslator.getMessage('auth_sign_in_provider_adguard')}
                    processing={requestProcessState === REQUEST_STATUSES.PENDING}
                    disabled={!username || authStore.error}
                />
            </div>
        );
    };

    const { credentials: { username } } = authStore;

    return (
        <form
            className={formClassName}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__group">
                    <InputField
                        id="username"
                        type="email"
                        value={username}
                        placeholder={reactTranslator.getMessage('auth_email')}
                        inputChangeHandler={inputChangeHandler}
                        error={authStore.error}
                    />
                    {authStore.error && (
                        <div className="form__error">
                            {ReactHtmlParser(authStore.error)}
                        </div>
                    )}
                </div>
            </div>

            {getSubmitButton()}
        </form>
    );
});
