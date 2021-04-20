import React from 'react';

import WebRTC from './WebRTC';
import Dns from './Dns';
import { ContextMenus } from './ContextMenus';
import { HelpUsImprove } from './HelpUsImprove';
import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';

export const Settings = () => (
    <>
        <Title title={reactTranslator.getMessage('settings_title')} />
        <div className="settings">
            <WebRTC />
            <ContextMenus />
            <HelpUsImprove />
            <Dns />
        </div>
    </>
);
