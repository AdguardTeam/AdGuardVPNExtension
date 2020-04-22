import React, { useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import translator from '../../../../lib/translator';
import rootStore from '../../../stores';
import { REQUEST_STATUSES } from '../../../stores/consts';

import Terms from '../Terms';
import Submit from '../Submit';
import InputField from '../InputField';

const CheckEmail = observer(() => {
    const { authStore } = useContext(rootStore);

    useEffect(() => {
        (async () => {
            await authStore.getAuthCacheFromBackground();
        })();
    }, []);

    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.checkEmail();
    };

    const inputChangeHandler = async (e) => {
        const { target: { name, value } } = e;
        await authStore.onCredentialsChange(name, value);
    };

    const { requestProcessState, credentials } = authStore;
    const { username } = credentials;

    return (
        <form
            className={`form form--login ${authStore.error && 'form--error'}`}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <InputField
                    id="username"
                    type="email"
                    value={username}
                    label={translator.translate('auth_email')}
                    inputChangeHandler={inputChangeHandler}
                    error={authStore.error}
                />
                {authStore.error && (
                    <div className="form__error">
                        {authStore.error}
                    </div>
                )}
            </div>
            <Terms />
            <div className="form__btn-wrap form__btn-wrap--check">
                <Submit
                    text={translator.translate('auth_next')}
                    processing={requestProcessState === REQUEST_STATUSES.PENDING}
                    disabled={!username}
                />
            </div>
        </form>
    );
});

export default CheckEmail;
