import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';

import translator from '../../../../lib/translator';
import rootStore from '../../../stores';
import { REQUEST_STATUSES, INPUT_TYPES } from '../../../stores/consts';

import PasswordField from '../PasswordField';
import Submit from '../Submit';

const RegistrationForm = observer(() => {
    const { authStore } = useContext(rootStore);

    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.register();
    };

    const inputChangeHandler = (e) => {
        const { target: { name, value } } = e;
        authStore.onCredentialsChange(name, value);
    };

    const { requestProcessState, credentials } = authStore;
    const { password, passwordAgain } = credentials;

    const [inputType, setInputType] = useState('password');

    const handleInputTypeChange = () => {
        setInputType(inputType === INPUT_TYPES.PASSWORD ? INPUT_TYPES.TEXT : INPUT_TYPES.PASSWORD);
    };

    const icon = inputType === INPUT_TYPES.PASSWORD ? '#closed_eye' : '#open_eye';

    return (
        <form
            className="form"
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <PasswordField
                    label={translator.translate('auth_password')}
                    id="password"
                    password={password}
                    error={authStore.error}
                    inputType={inputType}
                    handleChange={inputChangeHandler}
                    handleInputTypeChange={handleInputTypeChange}
                    icon={icon}
                />
                <PasswordField
                    label={translator.translate('auth_password_repeat')}
                    id="passwordAgain"
                    password={passwordAgain}
                    error={authStore.error}
                    autoFocus={false}
                    inputType={inputType}
                    handleChange={inputChangeHandler}
                />
                {authStore.error && (
                    <div className="form__error">
                        {ReactHtmlParser(authStore.error)}
                    </div>
                )}
            </div>
            <div className="form__btn-wrap">
                <Submit
                    text={translator.translate('auth_register')}
                    processing={requestProcessState === REQUEST_STATUSES.PENDING}
                    disabled={authStore.disableRegister}
                />
            </div>
        </form>
    );
});

export default RegistrationForm;
