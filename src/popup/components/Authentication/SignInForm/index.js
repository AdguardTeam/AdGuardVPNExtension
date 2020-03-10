import React, { useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import translator from '../../../../lib/translator';

import popupActions from '../../../actions/popupActions';
import rootStore from '../../../stores';
import { REQUEST_STATUSES, INPUT_TYPES } from '../../../stores/consts';

import PasswordField from '../PasswordField';
import Submit from '../Submit';

const SignInForm = observer(() => {
    const { authStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await authStore.getAuthCacheFromBackground();
        })();
    }, []);

    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.authenticate();
    };

    const inputChangeHandler = (e) => {
        const { target: { name, value } } = e;
        authStore.onCredentialsChange(name, value);
    };

    const { requestProcessState, credentials } = authStore;
    const { password } = credentials;

    const [inputType, setInputType] = useState('password');

    const handleInputTypeChange = () => {
        setInputType(inputType === INPUT_TYPES.PASSWORD ? INPUT_TYPES.TEXT : INPUT_TYPES.PASSWORD);
    };

    const icon = inputType === INPUT_TYPES.PASSWORD ? '#closed_eye' : '#open_eye';

    return (
        <form
            className="form form--login"
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <PasswordField
                    label={translator.translate('auth_password')}
                    id="password"
                    password={password}
                    handleChange={inputChangeHandler}
                    handleInputTypeChange={handleInputTypeChange}
                    icon={icon}
                    inputType={inputType}
                    error={authStore.error}
                />
                {authStore.error && (
                    <div className="form__error">
                        {authStore.error}
                    </div>
                )}
            </div>

            <div className="form__link-wrap">
                <button
                    type="button"
                    className="button button--inline form__link"
                    onClick={popupActions.openRecovery}
                >
                    {translator.translate('auth_recover')}
                </button>
            </div>

            <div className="form__btn-wrap">
                <Submit
                    text={translator.translate('auth_login')}
                    processing={requestProcessState === REQUEST_STATUSES.PENDING}
                    disabled={!password}
                />
            </div>
        </form>
    );
});

export default SignInForm;
