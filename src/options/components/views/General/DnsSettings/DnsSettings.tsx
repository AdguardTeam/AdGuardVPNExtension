import { observer } from 'mobx-react';
import React, { useContext } from 'react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { DEFAULT_DNS_SERVER, POPULAR_DNS_SERVERS } from '../../../../../background/dns/dnsConstants';
import { type DnsServerData } from '../../../../../background/schema';
import { Title } from '../../../ui/Title';
import { Button } from '../../../ui/Button';

import { DnsSettingsServer } from './DnsSettingsServer';

export const DnsSettings = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleGoBack = () => {
        settingsStore.setShowDnsSettings(false);
    };

    const handleSelect = (dnsServerId: string) => {
        settingsStore.setDnsServer(dnsServerId);
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
            <Button
                beforeIconName="plus"
                onClick={handleOpenModal}
            >
                {reactTranslator.getMessage('settings_dns_add_custom_server')}
            </Button>
            {/* FIXME: Add "Add custom server" modal */}
        </>
    );
});
