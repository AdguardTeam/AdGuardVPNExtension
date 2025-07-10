import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';

import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { RequestStatus } from '../../../stores/constants';
import { CredentialsKey } from '../../../stores/AuthStore';
import PasswordField from '../PasswordField';
import { Submit } from '../Submit';
import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { TelemetryScreenName } from '../../../../background/telemetry/telemetryEnums';
import { InputField } from '../InputField';

export const RegistrationForm = observer(() => {
    const { authStore, telemetryStore, settingsStore } = useContext(rootStore);
    const { showServerErrorPopup } = settingsStore;
    const {
        requestProcessState,
        credentials,
        onCredentialsChange,
    } = authStore;

    const { username, password, confirmPassword } = credentials;

    const canSendTelemetry = !showServerErrorPopup; // `DialogCantConnect` is rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.AuthSignupScreen,
        canSendTelemetry,
    );

    const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await authStore.register();
    };

    const formClassName = classnames(
        'form',
        { 'form--error': authStore.error },
    );

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
                    id={CredentialsKey.Username}
                    type="email"
                    value={username}
                    title={username}
                    label={translator.getMessage('auth_sign_in_provider_adguard_label')}
                    className="form__input__email-disabled"
                    disabled
                />
                <PasswordField
                    placeholder={translator.getMessage('auth_your_password')}
                    id={CredentialsKey.Password}
                    password={password}
                    error={authStore.error}
                    onChange={onCredentialsChange}
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
                    id={CredentialsKey.ConfirmPassword}
                    password={confirmPassword}
                    onChange={onCredentialsChange}
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
