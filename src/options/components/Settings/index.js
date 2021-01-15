import React from 'react';

import WebRTC from './WebRTC';
import Dns from './Dns';
import ContextMenus from './ContextMenus';
import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';

const Settings = () => (
    <>
        <Title title={reactTranslator.getMessage('settings_title')} />
        <div className="settings">
            <WebRTC />
            <ContextMenus />
            <Dns />
        </div>
    </>
);

export default Settings;
