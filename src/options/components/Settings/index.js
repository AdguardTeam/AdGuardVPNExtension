import React, { Fragment } from 'react';
import translator from '../../../lib/translator';

import WebRTC from './WebRTC';
import Title from '../ui/Title';

const Settings = () => (
    <Fragment>
        <Title title={translator.translate('settings_title')} />
        <div className="settings">
            <WebRTC />
        </div>
    </Fragment>
);

export default Settings;
