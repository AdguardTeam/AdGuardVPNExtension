import React from 'react';
import translator from '../../../lib/translator';

import WebRTC from './WebRTC';
import Dns from './Dns';
import ContextMenus from './ContextMenus';
import Title from '../ui/Title';

const Settings = () => (
    <>
        <Title title={translator.translate('settings_title')} />
        <div className="settings">
            <WebRTC />
            <ContextMenus />
            <Dns />
        </div>
    </>
);

export default Settings;
