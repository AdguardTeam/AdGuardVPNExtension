import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../stores';
import { EDIT_ACCOUNT_URL } from '../../../background/config';
import translator from '../../../lib/translator/translator';
import Title from '../ui/Title';
import './account.pcss';

const Account = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const signOut = async () => {
        await authStore.deauthenticate();
    };

    return (
        <>
            <Title title={translator.translate('account_title')} />
            <div className="account">
                <div className="account__email">
                    {settingsStore.currentUsername}
                </div>
                <div className="account__actions">
                    <a
                        href={EDIT_ACCOUNT_URL}
                        className="button button--medium button--outline-primary account__action"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {translator.translate('account_edit')}
                    </a>
                    <button
                        type="button"
                        className="button button--medium button--outline-secondary account__action"
                        onClick={signOut}
                    >
                        {translator.translate('account_sign_out')}
                    </button>
                </div>
            </div>
        </>
    );
});

export default Account;
