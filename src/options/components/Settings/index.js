import React from 'react';

import WebRTC from './WebRTC';
import Dns from './Dns';
import ContextMenus from './ContextMenus';
import Title from '../ui/Title';
import { reactTranslator } from '../../../reactCommon/reactTranslator';

const Settings = () => (
    <>
        <Title title={reactTranslator.translate('settings_title')} />
        <div className="settings">
            <WebRTC />
            <ContextMenus />
            <Dns />
        </div>
    </>
);

export default Settings;
