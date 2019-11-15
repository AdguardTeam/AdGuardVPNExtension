import React, { Fragment, useContext } from 'react';
import { observer } from 'mobx-react';
import browser from 'webextension-polyfill';

import rootStore from '../../stores';
import { EDIT_ACCOUNT_URL } from '../../../background/config';
import './account.pcss';

const Account = observer(() => {
    const { authStore, settingsStore } = useContext(rootStore);

    const signOut = async () => {
        await authStore.deauthenticate();
    };

    return (
        <Fragment>
            <h2 className="content__title">
                {browser.i18n.getMessage('account_title')}
            </h2>

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
                        {browser.i18n.getMessage('account_edit')}
                    </a>

                    <button
                        type="button"
                        className="button button--medium button--outline-secondary account__action"
                        onClick={signOut}
                    >
                        {browser.i18n.getMessage('account_sign_out')}
                    </button>
                </div>
            </div>
        </Fragment>
    );
});

export default Account;
