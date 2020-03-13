import React from 'react';
import translator from '../../../lib/translator';

import WebRTC from './WebRTC';
import Dns from './Dns';
import Title from '../ui/Title';

const Settings = () => (
    <>
        <Title title={translator.translate('settings_title')} />
        <div className="settings">
            <WebRTC />
            <Dns />
        </div>
    </>
);

export default Settings;
