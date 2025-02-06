import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { type DnsServerData } from '../../../../background/schema';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../../../background/dns/dnsConstants';
import { TelemetryScreenName } from '../../../../background/telemetry';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { Button } from '../../ui/Button';

import { DnsSettingsServer } from './DnsSettingsServer';
import { DnsSettingsServerModalAdd } from './DnsSettingsServerModalAdd';
import { DnsSettingsServerModalEdit } from './DnsSettingsServerModalEdit';

import './dns-settings.pcss';

export const DnsSettings = observer(() => {
    const { settingsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    // `DialogAddCustomDns` and `DialogEditCustomDns` rendered on top of this screen
    const canSendTelemetry = !settingsStore.isCustomDnsModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SettingsDnsServersScreen,
        canSendTelemetry,
    );

    const handleGoBack = () => {
        settingsStore.setShowDnsSettings(false);
    };

    const handleSelect = (dnsServerId: string) => {
        settingsStore.setDnsServer(dnsServerId);
    };

    const handleAddClick = () => {
        settingsStore.openCustomDnsModal();
    };

    const handleEditClick = (dnsServer: DnsServerData) => {
        settingsStore.setDnsServerToEdit(dnsServer);
        settingsStore.openCustomDnsModal();
    };

    const handleDeleteClick = (dnsServerId: string) => {
        settingsStore.removeCustomDnsServer(dnsServerId);
        notificationsStore.notifySuccess(
            translator.getMessage('settings_dns_delete_custom_server_notification'),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.restoreCustomDnsServersData(),
            },
        );
    };

    const renderDnsServer = (dnsServer: DnsServerData) => (
        <DnsSettingsServer
            key={dnsServer.id}
            name="dns-server"
            value={dnsServer}
            isActive={dnsServer.id === settingsStore.dnsServer}
            onSelect={handleSelect}
        />
    );

    const renderCustomDnsServer = (dnsServer: DnsServerData) => (
        <DnsSettingsServer
            key={dnsServer.id}
            name="dns-server"
            value={dnsServer}
            isActive={dnsServer.id === settingsStore.dnsServer}
            onSelect={handleSelect}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            custom
        />
    );

    return (
        <>
            <Title
                title={translator.getMessage('settings_dns_label')}
                onClick={handleGoBack}
                className="dns-settings__title"
            />

            {/* DEFAULT SERVER */}
            {renderDnsServer(DEFAULT_DNS_SERVER)}

            {/* POPULAR SERVERS */}
            <Title
                title={translator.getMessage('settings_dns_popular_servers')}
                size="medium"
                className="dns-settings__popular-servers"
            />
            {POPULAR_DNS_SERVERS.map(renderDnsServer)}

            {/* CUSTOM SERVERS */}
            <Title
                title={translator.getMessage('settings_dns_custom_servers')}
                size="medium"
                className="dns-settings__custom-servers"
            />
            {settingsStore.customDnsServers.map(renderCustomDnsServer)}
            <Button variant="transparent" beforeIconName="plus" onClick={handleAddClick}>
                {translator.getMessage('settings_dns_add_custom_server')}
            </Button>
            <DnsSettingsServerModalAdd />
            <DnsSettingsServerModalEdit />
        </>
    );
});
