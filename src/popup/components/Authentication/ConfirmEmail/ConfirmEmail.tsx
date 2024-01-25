import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';

import classnames from 'classnames';

import { translator } from '../../../../common/translator';
import { reactTranslator } from '../../../../common/reactTranslator';
import { rootStore } from '../../../stores';
import { RequestStatus } from '../../../stores/constants';
import { Submit } from '../Submit';
import { InputField } from '../InputField';

export const ConfirmEmail = observer(() => {
    const { authStore } = useContext(rootStore);
    const {
        resendEmailConfirmationCode,
        resendCodeCountdown,
        requestProcessState,
        credentials,
    } = authStore;

    const { code } = credentials;

    const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await authStore.authenticate();
    };

    const inputChangeHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const { target: { name, value } } = event;
        await authStore.onCredentialsChange(name, value);
    };

    const resendCode = () => {
        resendEmailConfirmationCode();
    };

    const formClassName = classnames(
        'form form--confirm-email',
        { 'form--error': authStore.error },
    );

    return (
        <form
            className={formClassName}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__subtitle">
                    {translator.getMessage('confirm_email_title')}
                </div>
                <div className="form__info">
                    {
                        reactTranslator.getMessage('confirm_email_info', {
                            email: authStore.credentials.username,
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
                <InputField
                    id="code"
                    type="text"
                    value={code}
                    placeholder={translator.getMessage('confirm_email_code_placeholder')}
                    inputChangeHandler={inputChangeHandler}
                    error={authStore.error}
                    label={translator.getMessage('confirm_email_code_label')}
                    autocomplete="off"
                />
                {authStore.error && (
                    <div className="form__error">
                        {ReactHtmlParser(authStore.error)}
                    </div>
                )}
            </div>

            <div className="form__btn-wrap">
                <Submit
                    text={translator.getMessage('auth_confirm')}
                    processing={requestProcessState === RequestStatus.Pending}
                    disabled={!code || !!authStore.error}
                />
            </div>

            <div>
                <button
                    type="button"
                    className="button button--inline button--simple-green"
                    onClick={resendCode}
                    disabled={!!resendCodeCountdown}
                >
                    {
                        resendCodeCountdown
                            ? translator.getMessage('confirm_email_resend_code_button_disabled', { count: resendCodeCountdown })
                            : translator.getMessage('confirm_email_resend_code_button')
                    }
                </button>
            </div>
        </form>
    );
});
