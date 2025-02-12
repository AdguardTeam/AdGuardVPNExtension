import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';

import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { RequestStatus, InputType } from '../../../stores/constants';
import PasswordField from '../PasswordField';
import { Submit } from '../Submit';
import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { TelemetryScreenName } from '../../../../background/telemetry';
import { InputField } from '../InputField';

export const RegistrationForm = observer(() => {
    const { authStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.AuthSignupScreen,
    );

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

    const [passwordInputType, setPasswordInputType] = useState(InputType.Password);
    const [confirmPasswordInputType, setConfirmPasswordInputType] = useState(InputType.Password);

    const handlePasswordInputTypeChange = () => {
        setPasswordInputType(
            passwordInputType === InputType.Password
                ? InputType.Text
                : InputType.Password,
        );
    };

    const handleConfirmPasswordInputTypeChange = () => {
        setConfirmPasswordInputType(
            confirmPasswordInputType === InputType.Password
                ? InputType.Text
                : InputType.Password,
        );
    };

    const formClassName = classnames(
        'form',
        { 'form--error': authStore.error },
    );

    const passwordIcon = passwordInputType === InputType.Password ? '#closed_eye' : '#open_eye';
    const confirmPasswordIcon = confirmPasswordInputType === InputType.Password ? '#closed_eye' : '#open_eye';

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
                    title={authStore.credentials.username}
                    label={translator.getMessage('auth_sign_in_provider_adguard_label')}
                    className="form__input__email-disabled"
                    disabled
                />
                <PasswordField
                    placeholder={translator.getMessage('auth_your_password')}
                    id="password"
                    password={password}
                    error={authStore.error}
                    inputType={passwordInputType}
                    handleChange={inputChangeHandler}
                    handleInputTypeChange={handlePasswordInputTypeChange}
                    icon={passwordIcon}
                    label={translator.getMessage('auth_password')}
                    focus
                />
                {authStore.error && (
                    <div className="form__error">
                        {ReactHtmlParser(authStore.error)}
                    </div>
                )}
                <PasswordField
                    placeholder={translator.getMessage('auth_your_password')}
                    id="confirmPassword"
                    password={confirmPassword}
                    inputType={confirmPasswordInputType}
                    handleChange={inputChangeHandler}
                    handleInputTypeChange={handleConfirmPasswordInputTypeChange}
                    icon={confirmPasswordIcon}
                    label={translator.getMessage('auth_password_confirm')}
                />
            </div>
            <div className="form__btn-wrap form__btn-wrap--register">
                <Submit
                    text={reactTranslator.getMessage('auth_sign_up_button')}
                    processing={requestProcessState === RequestStatus.Pending}
                    disabled={authStore.disableRegister}
                />
            </div>
        </form>
    );
});
