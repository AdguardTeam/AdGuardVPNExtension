import React from 'react';
import { useLocation } from 'react-router-dom';

import WebRTC from './WebRTC';
import { DnsMenuItem } from './DnsMenuItem';
import { ContextMenus } from './ContextMenus';
import { HelpUsImprove } from './HelpUsImprove';
import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';
import { AppearanceTheme } from './AppearanceTheme';
import { DnsSettings } from './DnsSettings';
import { DNS_SETTINGS_QUERY } from '../../stores/consts';

export const Settings = () => {
    const query = new URLSearchParams(useLocation().search);
    if (query.has(DNS_SETTINGS_QUERY)) {
        return (
            <DnsSettings />
        );
    }

    return (
        <>
            <Title title={reactTranslator.getMessage('settings_title')} />
            <div className="general-settings">
                <AppearanceTheme />
                <ContextMenus />
                <HelpUsImprove />
                <WebRTC />
                <DnsMenuItem />
            </div>
        </>
    );
};
