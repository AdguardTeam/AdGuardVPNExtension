import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { translator } from '../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
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
    const { settingsStore, telemetryStore } = useContext(rootStore);
    const { showDnsSettings } = settingsStore;

    // `SettingsDnsServersScreen` is rendered on top of this screen
    const canSendTelemetry = !showDnsSettings;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SettingsScreen,
        canSendTelemetry,
    );

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
