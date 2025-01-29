import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';

import { QuickConnect } from './QuickConnect';
import { Theme } from './Theme';
import { ContextMenus } from './ContextMenus';
import { HelpUsImprove } from './HelpUsImprove';
import { WebRTC } from './WebRTC';
import { DnsSettings, DnsSettingsButton } from './DnsSettings';

import './general.pcss';

export const General = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { showDnsSettings } = settingsStore;

    if (showDnsSettings) {
        return <DnsSettings />;
    }

    return (
        <>
            <Title title={translator.getMessage('settings_general_title')} />
            <QuickConnect />
            <Theme />
            <ContextMenus />
            <HelpUsImprove />
            <WebRTC />
            <DnsSettingsButton />
        </>
    );
});
