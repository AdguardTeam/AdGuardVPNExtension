import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import ReactHtmlParser from 'react-html-parser';
import { rootStore } from '../../../stores';
import { REQUEST_STATUSES } from '../../../stores/consts';

import { Submit } from '../Submit';
import { InputField } from '../InputField';
import { reactTranslator } from '../../../../common/reactTranslator';

const TwoFactorForm = observer(() => {
    const { authStore } = useContext(rootStore);
    const submitHandler = async (e) => {
        e.preventDefault();
        await authStore.authenticate();
    };

    const inputChangeHandler = async (e) => {
        const { target: { name, value } } = e;
        await authStore.onCredentialsChange(name, value);
    };

    const { requestProcessState, credentials } = authStore;
    const { twoFactor } = credentials;

    return (
        <form
            className="form form--2fa"
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <div className="form__subtitle">
                    {reactTranslator.getMessage('auth_header_2fa_subtitle')}
                </div>
                <div className="form__info">
                    {reactTranslator.getMessage('auth_header_2fa')}
                </div>
                <InputField
                    id="twoFactor"
                    type="text"
                    value={twoFactor}
                    inputChangeHandler={inputChangeHandler}
                    error={authStore.error}
                    placeholder={reactTranslator.getMessage('auth_placeholder_2fa')}
                    className="form__input--big"
                />
                {authStore.error && (
                    <div className="form__error">
                        {ReactHtmlParser(authStore.error)}
                    </div>
                )}
            </div>

            <div className="form__btn-wrap">
                <Submit
                    text={reactTranslator.getMessage('auth_confirm')}
                    processing={requestProcessState === REQUEST_STATUSES.PENDING}
                    disabled={!twoFactor}
                />
            </div>
        </form>
    );
});

export default TwoFactorForm;
