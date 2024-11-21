import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { Title } from '../ui/Title';
import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';

import { WebRTC } from './WebRTC';
import { DnsMenuItem } from './DnsMenuItem';
import { ContextMenus } from './ContextMenus';
import { HelpUsImprove } from './HelpUsImprove';
import { AppearanceThemeSetting } from './AppearanceTheme';
import { QuickConnect } from './QuickConnect';
import { DnsSettings } from './DnsSettings';

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
                <AppearanceThemeSetting />
                <ContextMenus />
                <HelpUsImprove />
                <WebRTC />
                <DnsMenuItem />
            </div>
        </>
    );
});
