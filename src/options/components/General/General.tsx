import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';

import { QuickConnect } from './QuickConnect';
import { AppearanceTheme } from './AppearanceTheme';
import { ContextMenus } from './ContextMenus';
import { HelpUsImprove } from './HelpUsImprove';
import { WebRTC } from './WebRTC';
import { DnsSettingsButton, DnsSettings } from './DnsSettings';

export const General = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { showDnsSettings } = settingsStore;

    if (showDnsSettings) {
        return <DnsSettings />;
    }

    return (
        <>
            {/* FIXME: Translation */}
            <Title title="General" />
            <QuickConnect />
            <AppearanceTheme />
            <ContextMenus />
            <HelpUsImprove />
            <WebRTC />
            <DnsSettingsButton />
        </>
    );
});
