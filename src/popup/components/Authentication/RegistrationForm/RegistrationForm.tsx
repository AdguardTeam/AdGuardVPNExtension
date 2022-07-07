import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { REQUEST_STATUSES, INPUT_TYPES } from '../../../stores/consts';
import PasswordField from '../PasswordField';
import { Submit } from '../Submit';
import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { InputField } from '../InputField';

export const RegistrationForm = observer(() => {
    const { authStore } = useContext(rootStore);

    const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await authStore.register();
    };

    const inputChangeHandler = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { target: { name, value } } = e;
        await authStore.onCredentialsChange(name, value);
    };

    const { requestProcessState, credentials } = authStore;
    const { password, confirmPassword } = credentials;

    const [inputType, setInputType] = useState('password');

    const handleInputTypeChange = () => {
        setInputType(inputType === INPUT_TYPES.PASSWORD ? INPUT_TYPES.TEXT : INPUT_TYPES.PASSWORD);
    };

    const formClassName = classnames(
        'form',
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
                    {reactTranslator.getMessage('auth_sign_up')}
                </div>
                <div className="form__info">
                    {reactTranslator.getMessage('auth_sign_up_info')}
                </div>
                <InputField
                    id="username"
                    type="email"
                    value={authStore.credentials.username}
                    label={translator.getMessage('auth_sign_in_provider_adguard_label')}
                    className="form__input__email-disabled"
                    disabled
                />
                <PasswordField
                    placeholder={translator.getMessage('auth_your_password')}
                    id="password"
                    password={password}
                    error={authStore.error}
                    inputType={inputType}
                    handleChange={inputChangeHandler}
                    handleInputTypeChange={handleInputTypeChange}
                    icon={icon}
                    label={translator.getMessage('auth_password')}
                    focus
                />
                {authStore.error && (
                    <div className="form__error">
                        {ReactHtmlParser(authStore.error as unknown as string)}
                    </div>
                )}
                <PasswordField
                    placeholder={translator.getMessage('auth_your_password')}
                    id="confirmPassword"
                    password={confirmPassword}
                    inputType={inputType}
                    handleChange={inputChangeHandler}
                    label={translator.getMessage('auth_password_confirm')}
                />
            </div>
            <div className="form__btn-wrap form__btn-wrap--register">
                <Submit
                    text={reactTranslator.getMessage('auth_sign_up_button')}
                    processing={requestProcessState === REQUEST_STATUSES.PENDING}
                    disabled={authStore.disableRegister}
                />
            </div>
        </form>
    );
});
