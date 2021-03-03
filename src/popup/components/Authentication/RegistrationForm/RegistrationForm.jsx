import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';
import classnames from 'classnames';

import rootStore from '../../../stores';
import { REQUEST_STATUSES, INPUT_TYPES } from '../../../stores/consts';
import PasswordField from '../PasswordField';
import Submit from '../Submit';
import Terms from '../Terms';
import { reactTranslator } from '../../../../common/reactTranslator';

export const RegistrationForm = observer(() => {
    const { authStore } = useContext(rootStore);

    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.register();
    };

    const inputChangeHandler = async (e) => {
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
                    {reactTranslator.getMessage('auth_header_registration', {
                        username: authStore.credentials.username,
                        div: (chunks) => (
                            // make sure that css styles won't be broken
                            // if div is placed in the translation beginning
                            <div className="form__credentials">
                                {chunks}
                            </div>
                        ),
                    })}
                </div>
                <PasswordField
                    placeholder={reactTranslator.getMessage('auth_password')}
                    id="password"
                    password={password}
                    error={authStore.error}
                    inputType={inputType}
                    handleChange={inputChangeHandler}
                    handleInputTypeChange={handleInputTypeChange}
                    icon={icon}
                />
                {authStore.error && (
                    <div className="form__error">
                        {ReactHtmlParser(authStore.error)}
                    </div>
                )}
            </div>
            <div className="form__btn-wrap form__btn-wrap--register">
                <Submit
                    text={reactTranslator.getMessage('auth_sign_up_button')}
                    processing={requestProcessState === REQUEST_STATUSES.PENDING}
                    disabled={authStore.disableRegister}
                />
            </div>
            <Terms />
        </form>
    );
});
