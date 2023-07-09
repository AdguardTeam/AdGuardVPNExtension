import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';
import classnames from 'classnames';

import { rootStore } from '../../stores';

import { Submit } from '../Authentication/Submit';
import { InputField } from '../Authentication/InputField';
import { reactTranslator } from '../../../common/reactTranslator';

import './confirm-email.pcss';

export const ConfirmEmail = observer(() => {
    const { authStore } = useContext(rootStore);
    const {
        resendConfirmRegistrationLink,
        userEmail,
        confirmEmailError,
        confirmEmailCountDown,
    } = authStore;

    const [confirmCode, setConfirmCode] = useState('');

    const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await authStore.checkEmail();
    };

    const inputChangeHandler = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const { target: { value } } = event;
        setConfirmCode(value);
    };

    const resendLink = () => {
        // FIXME: rename to requestConfirmEmailCode
        resendConfirmRegistrationLink();
    };

    const formClassName = classnames(
        'form confirm-email',
        { 'form--error': confirmEmailError },
    );

    // TODO: resolve form error (backend is not ready)
    const formError = confirmEmailError ? '' : '';

    return (
        <form
            className={formClassName}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__subtitle">
                    {reactTranslator.getMessage('confirm_email_title')}
                </div>
                <div className="form__info">
                    {reactTranslator.getMessage('confirm_email_info', { email: userEmail })}
                </div>
                <div className="form__group confirm-email__field">
                    <InputField
                        id="confirm"
                        type="text"
                        value={confirmCode}
                        placeholder="Contains numbers and letters"
                        inputChangeHandler={inputChangeHandler}
                        error={formError}
                        label="Confirmation code"
                    />
                    {authStore.error && (
                        <div className="form__error">
                            {ReactHtmlParser(authStore.error)}
                        </div>
                    )}
                </div>
            </div>

            <div className="form__btn-wrap confirm-email__submit">
                <Submit
                    text="Confirm"
                    processing={false}
                    disabled={!confirmCode}
                />
            </div>

            <button
                type="button"
                className="button button--simple-green"
                onClick={resendLink}
                disabled={!!confirmEmailCountDown}
            >
                {
                    confirmEmailCountDown
                        ? reactTranslator.getMessage('confirm_email_resend_link_button_disabled', { count: confirmEmailCountDown })
                        : reactTranslator.getMessage('confirm_email_resend_link_button')
                }
            </button>
        </form>
    );
});
