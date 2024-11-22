import { observer } from 'mobx-react';
import React, { useContext } from 'react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../../../../background/dns/dnsConstants';
import { type DnsServerData } from '../../../../../background/schema';
import { Title } from '../../../ui/Title';
import { Button } from '../../../ui/Button';

import { DnsSettingsServer } from './DnsSettingsServer';
import { DnsSettingsServerModalAdd } from './DnsSettingsServerModalAdd';
import { DnsSettingsServerModalEdit } from './DnsSettingsServerModalEdit';

export const DnsSettings = observer(() => {
    const { settingsStore, notificationsStore } = useContext(rootStore);

    const handleGoBack = () => {
        settingsStore.setShowDnsSettings(false);
    };

    const handleSelect = (dnsServerId: string) => {
        settingsStore.setDnsServer(dnsServerId);
    };

    const handleEdit = (dnsServer: DnsServerData) => {
        settingsStore.setDnsServerToEdit(dnsServer);
        settingsStore.openCustomDnsModal();
    };

    const handleDelete = (dnsServerId: string) => {
        settingsStore.removeCustomDnsServer(dnsServerId);
        notificationsStore.notifySuccess(
            reactTranslator.getMessage('settings_dns_delete_custom_server_notification'),
            {
                action: reactTranslator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.restoreCustomDnsServersData(),
            },
        );
    };

    const handleOpenModal = () => {
        settingsStore.openCustomDnsModal();
    };

    const renderDnsServer = (dnsServer: DnsServerData) => (
        <DnsSettingsServer
            key={dnsServer.id}
            value={dnsServer}
            active={dnsServer.id === settingsStore.dnsServer}
            onSelect={handleSelect}
        />
    );

    const renderCustomDnsServer = (dnsServer: DnsServerData) => (
        <DnsSettingsServer
            key={dnsServer.id}
            value={dnsServer}
            active={dnsServer.id === settingsStore.dnsServer}
            onSelect={handleSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
            custom
        />
    );

    return (
        <>
            <Title
                title={reactTranslator.getMessage('settings_dns_label')}
                onClick={handleGoBack}
                style={{ marginBottom: 24 }}
            />
            {/* DEFAULT SERVER */}
            {renderDnsServer(DEFAULT_DNS_SERVER)}

            {/* POPULAR SERVERS */}
            <Title
                title={reactTranslator.getMessage('settings_dns_popular_servers')}
                size="medium"
                style={{ paddingTop: 32 }}
            />
            {POPULAR_DNS_SERVERS.map(renderDnsServer)}

            {/* CUSTOM SERVERS */}
            <Title
                title={reactTranslator.getMessage('settings_dns_custom_servers')}
                size="medium"
                style={{ paddingTop: 48 }}
            />
            {settingsStore.customDnsServers.map(renderCustomDnsServer)}

            {/* ADD CUSTOM SERVER */}
            <Button variant="ghost" beforeIconName="plus" onClick={handleOpenModal}>
                {reactTranslator.getMessage('settings_dns_add_custom_server')}
            </Button>
            <DnsSettingsServerModalAdd />
            <DnsSettingsServerModalEdit />
        </>
    );
});
