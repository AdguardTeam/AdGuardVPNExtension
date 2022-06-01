import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { REQUEST_STATUSES } from '../../../stores/consts';

import { Submit } from '../Submit';
import { InputField } from '../InputField';
import { translator } from '../../../../common/translator';

export const EmailAuth = observer(() => {
    const { authStore } = useContext(rootStore);

    const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await authStore.checkEmail();
    };

    const inputChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { target: { name, value } } = e;
        await authStore.onCredentialsChange(name, value);
    };

    const formClassName = classnames(
        'form form--login',
        { 'form--error': authStore.error },
    );

    const getSubmitButton = () => {
        const { requestProcessState, credentials } = authStore;
        const { username } = credentials;

        return (
            <div className="form__btn-wrap">
                <Submit
                    text={translator.getMessage('auth_sign_in_provider_adguard')}
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
                        placeholder={translator.getMessage('auth_email')}
                        inputChangeHandler={inputChangeHandler}
                        error={authStore.error}
                        label={translator.getMessage('auth_sign_in_provider_adguard_label')}
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
