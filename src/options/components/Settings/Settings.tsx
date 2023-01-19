import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { WebRTC } from './WebRTC';
import { DnsMenuItem } from './DnsMenuItem';
import { ContextMenus } from './ContextMenus';
import { HelpUsImprove } from './HelpUsImprove';
import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';
import { AppearanceTheme } from './AppearanceTheme';
import { QuickConnect } from './QuickConnect';
import { DnsSettings } from './DnsSettings';
import { rootStore } from '../../stores';

export const Settings = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { showDnsSettings } = settingsStore;

    if (showDnsSettings) {
        return (
            <DnsSettings />
        );
    }

    return (
        <>
            <Title title={reactTranslator.getMessage('settings_title')} />
            <div className="general-settings">
                <QuickConnect />
                <AppearanceTheme />
                <ContextMenus />
                <HelpUsImprove />
                <WebRTC />
                <DnsMenuItem />
            </div>
        </>
    );
});
