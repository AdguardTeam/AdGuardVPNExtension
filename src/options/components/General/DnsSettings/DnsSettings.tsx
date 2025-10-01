import React, { type ReactElement, useContext } from 'react';
import { observer } from 'mobx-react';

import { type DnsServerData } from '../../../../background/schema';
import {
    DEFAULT_DNS_SERVER,
    POPULAR_DNS_SERVERS,
    ADGUARD_DNS_ID,
    ADGUARD_NON_FILTERING_DNS_ID,
    ADGUARD_FAMILY_DNS_ID,
    GOOGLE_DNS_ID,
    CLOUDFLARE_DNS_ID,
    CISCO_DNS_ID,
    QUAD9_DNS_ID,
} from '../../../../common/dnsConstants';
import {
    TelemetryActionName,
    TelemetryScreenName,
    type DnsServerClickActionNames,
} from '../../../../background/telemetry/telemetryEnums';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry/useTelemetryPageViewEvent';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { Button } from '../../ui/Button';

import { DnsSettingsServer } from './DnsSettingsServer';
import { DnsSettingsServerModalAdd } from './DnsSettingsServerModalAdd';
import { DnsSettingsServerModalEdit } from './DnsSettingsServerModalEdit';

import './dns-settings.pcss';

/**
 * Map of popular DNS server IDs to telemetry action names.
 */
const POPULAR_DNS_SERVER_ID_ACTION_MAP: Record<string, DnsServerClickActionNames | undefined> = {
    [ADGUARD_DNS_ID]: TelemetryActionName.AdguardDnsClick,
    [ADGUARD_NON_FILTERING_DNS_ID]: TelemetryActionName.AdguardNonfilteringDnsClick,
    [ADGUARD_FAMILY_DNS_ID]: TelemetryActionName.AdguardFamilyDnsClick,
    [GOOGLE_DNS_ID]: TelemetryActionName.GoogleDnsClick,
    [CLOUDFLARE_DNS_ID]: TelemetryActionName.CloudflareDnsClick,
    [CISCO_DNS_ID]: TelemetryActionName.CiscoDnsClick,
    [QUAD9_DNS_ID]: TelemetryActionName.QuadDnsClick,
};

/**
 * DNS settings page component.
 */
export const DnsSettings = observer(() => {
    const { settingsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    // `DialogAddCustomDns` and `DialogEditCustomDns` rendered on top of this screen
    const canSendTelemetry = !settingsStore.isCustomDnsModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.SettingsDnsServersScreen,
        canSendTelemetry,
    );

    const handleGoBack = (): void => {
        settingsStore.setShowDnsSettings(false);
    };

    const handleSelect = (dnsServerId: string): void => {
        const telemetryActionName = POPULAR_DNS_SERVER_ID_ACTION_MAP[dnsServerId];
        if (telemetryActionName) {
            telemetryStore.sendCustomEvent(
                telemetryActionName,
                TelemetryScreenName.SettingsDnsServersScreen,
            );
        }

        settingsStore.setDnsServer(dnsServerId);
    };

    const handleAddClick = (): void => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.AddCustomDnsClick,
            TelemetryScreenName.SettingsDnsServersScreen,
        );
        settingsStore.openCustomDnsModal();
    };

    const handleEditClick = (dnsServer: DnsServerData): void => {
        settingsStore.setDnsServerToEdit(dnsServer);
        settingsStore.openCustomDnsModal();
    };

    const handleDeleteClick = (dnsServerId: string): void => {
        settingsStore.removeCustomDnsServer(dnsServerId);
        notificationsStore.notifySuccess(
            translator.getMessage('settings_dns_delete_custom_server_notification'),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.restoreCustomDnsServersData(),
            },
        );
    };

    const renderDnsServer = (dnsServer: DnsServerData): ReactElement => (
        <DnsSettingsServer
            key={dnsServer.id}
            name="dns-server"
            value={dnsServer}
            isActive={dnsServer.id === settingsStore.dnsServer}
            onSelect={handleSelect}
        />
    );

    const renderCustomDnsServer = (dnsServer: DnsServerData): ReactElement => (
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
