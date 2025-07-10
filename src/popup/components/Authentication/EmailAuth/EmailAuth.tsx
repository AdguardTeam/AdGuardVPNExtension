import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import ReactHtmlParser from 'react-html-parser';

import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { RequestStatus } from '../../../stores/constants';
import { CredentialsKey } from '../../../stores/AuthStore';
import { Submit } from '../Submit';
import { InputField } from '../InputField';
import { translator } from '../../../../common/translator';

export const EmailAuth = observer(() => {
    const { authStore } = useContext(rootStore);
    const {
        username,
        requestProcessState,
        error,
        onCredentialsChange,
    } = authStore;

    const submitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await authStore.checkEmail();
    };

    const formClassName = classnames(
        'form form--login',
        { 'form--error': error },
    );

    const getSubmitButton = () => (
        <div className="form__btn-wrap">
            <Submit
                text={translator.getMessage('auth_sign_in_provider_adguard')}
                processing={requestProcessState === RequestStatus.Pending}
                disabled={!username || !!authStore.error}
            />
        </div>
    );

    return (
        <form
            className={formClassName}
            onSubmit={submitHandler}
        >
            <div className="form__inputs">
                <InputField
                    id={CredentialsKey.Username}
                    type="email"
                    value={username}
                    placeholder={translator.getMessage('auth_email')}
                    onChange={onCredentialsChange}
                    error={authStore.error}
                    label={translator.getMessage('auth_sign_in_provider_adguard_label')}
                />
                {authStore.error && (
                    <div className="form__error">
                        {ReactHtmlParser(authStore.error)}
                    </div>
                )}
            </div>

            {getSubmitButton()}
        </form>
    );
});
