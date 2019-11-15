import React, { Fragment } from 'react';
import browser from 'webextension-polyfill';

import Form from './Form';
import List from './List';

const Exclusions = () => (
    <Fragment>
        <div className="settings__section">
            <div className="settings__title">
                {browser.i18n.getMessage('settings_exclusion_title')}
            </div>
            <div className="settings__group">
                <div className="settings__subtitle">
                    {browser.i18n.getMessage('settings_exclusion_expect')}
                </div>
                <Form />
                <List />
            </div>
        </div>
    </Fragment>
);

export default Exclusions;
