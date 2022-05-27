import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import ReactHtmlParser from 'react-html-parser';

import { popupActions } from '../../../actions/popupActions';
import { rootStore } from '../../../stores';
import { REQUEST_STATUSES, INPUT_TYPES } from '../../../stores/consts';
import PasswordField from '../PasswordField';
import Submit from '../Submit';
import { reactTranslator } from '../../../../common/reactTranslator';

export const SignInForm = observer(() => {
    const { authStore } = useContext(rootStore);

    const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await authStore.authenticate();
    };

    const inputChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { target: { name, value } } = e;
        await authStore.onCredentialsChange(name, value);
    };

    const { requestProcessState, credentials } = authStore;
    const { password } = credentials;

    const [inputType, setInputType] = useState('password');

    const handleInputTypeChange = () => {
        setInputType(inputType === INPUT_TYPES.PASSWORD ? INPUT_TYPES.TEXT : INPUT_TYPES.PASSWORD);
    };

    const formClassName = classnames(
        'form',
        'form--login',
        { 'form--error': authStore.error },
    );

    const icon = inputType === INPUT_TYPES.PASSWORD ? '#closed_eye' : '#open_eye';

    return (
        <form
            className={formClassName}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__subtitle">
                    {reactTranslator.getMessage('auth_sign_in')}
                </div>
                <div className="form__info">
                    {
                        reactTranslator.getMessage('auth_header_sing_in_notice', {
                            username: authStore.credentials.username,
                            span: (chunks: string) => (
                                <span className="form__credentials">
                                    {chunks}
                                </span>
                            ),
                        })
                    }
                </div>
                <PasswordField
                    placeholder={reactTranslator.getMessage('auth_password') as string}
                    id="password"
                    password={password}
                    handleChange={inputChangeHandler}
                    handleInputTypeChange={handleInputTypeChange}
                    icon={icon}
                    inputType={inputType}
                    error={authStore.error}
                    label={reactTranslator.getMessage('auth_password') as string}
                    focus
                />
                {authStore.error && (
                    <div className="form__error">
                        {ReactHtmlParser(authStore.error)}
                    </div>
                )}
            </div>

            <div className="form__btn-wrap">
                <Submit
                    text={reactTranslator.getMessage('auth_sign_in_button')}
                    processing={requestProcessState === REQUEST_STATUSES.PENDING}
                    disabled={!password}
                />
            </div>

            <button
                type="button"
                className="button button--inline form__link form__link--recover"
                onClick={popupActions.openRecovery}
            >
                {reactTranslator.getMessage('auth_recover')}
            </button>
        </form>
    );
});
