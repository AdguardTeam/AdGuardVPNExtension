import React, { Fragment } from 'react';
import browser from 'webextension-polyfill';

import Exclusions from './Exclusions';
import './settings.pcss';
import '../ui/radio.pcss';

const Settings = () => (
    <Fragment>
        <h2 className="content__title">
            {browser.i18n.getMessage('settings_title')}
        </h2>
        <div className="settings">
            <Exclusions />
        </div>
    </Fragment>
);

export default Settings;
