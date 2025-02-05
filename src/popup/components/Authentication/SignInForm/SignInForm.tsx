import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';

import classnames from 'classnames';

import { popupActions } from '../../../actions/popupActions';
import { rootStore } from '../../../stores';
import { RequestStatus, InputType } from '../../../stores/constants';
import PasswordField from '../PasswordField';
import { Submit } from '../Submit';
import { FORWARDER_URL_QUERIES } from '../../../../background/config';
import { getForwarderUrl } from '../../../../common/helpers';
import { reactTranslator } from '../../../../common/reactTranslator';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { TelemetryScreenName } from '../../../../background/telemetry';

export const SignInForm = observer(() => {
    const { authStore, settingsStore, telemetryStore } = useContext(rootStore);

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.AuthLoginScreen,
    );

    const { forwarderDomain } = settingsStore;

    const recoveryUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.PASSWORD_RECOVERY);

    const handleRecoveryClick = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
        e.preventDefault();
        await popupActions.openTab(recoveryUrl);
    };

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
        setInputType(inputType === InputType.Password ? InputType.Text : InputType.Password);
    };

    const formClassName = classnames(
        'form',
        'form--login',
        { 'form--error': authStore.error },
    );

    const icon = inputType === InputType.Password ? '#closed_eye' : '#open_eye';

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
                                <span
                                    className="form__credentials"
                                    title={chunks}
                                >
                                    {chunks}
                                </span>
                            ),
                        })
                    }
                </div>
                <PasswordField
                    placeholder={translator.getMessage('auth_your_password')}
                    id="password"
                    password={password}
                    handleChange={inputChangeHandler}
                    handleInputTypeChange={handleInputTypeChange}
                    icon={icon}
                    inputType={inputType}
                    error={authStore.error}
                    label={translator.getMessage('auth_password')}
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
                    processing={requestProcessState === RequestStatus.Pending}
                    disabled={!password}
                />
            </div>

            <div>
                <button
                    type="button"
                    className="button button--inline form__link form__link--recover"
                    onClick={handleRecoveryClick}
                >
                    {reactTranslator.getMessage('auth_recover')}
                </button>
            </div>
        </form>
    );
});
