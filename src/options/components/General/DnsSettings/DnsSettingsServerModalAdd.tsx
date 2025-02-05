import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { getForwarderUrl } from '../../../../common/helpers';
import { translator } from '../../../../common/translator';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { TelemetryScreenName } from '../../../../background/telemetry';
import { FORWARDER_URL_QUERIES } from '../../../../background/config';

import { DnsSettingsServerModal } from './DnsSettingsServerModal';
import { normalizeDnsServerAddress, validateDnsServerAddress } from './validate';

export const DnsSettingsServerModalAdd = observer(() => {
    const { settingsStore, notificationsStore, telemetryStore } = useContext(rootStore);

    const {
        forwarderDomain,
        isCustomDnsModalOpen,
        customDnsServers,
        dnsServerToEdit,
    } = settingsStore;

    const isOpen = isCustomDnsModalOpen && !dnsServerToEdit;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.DialogAddCustomDns,
        isOpen,
    );

    const adguardKnownDnsKbUrl = getForwarderUrl(
        forwarderDomain,
        FORWARDER_URL_QUERIES.ADGUARD_DNS_PROVIDERS_KB,
    );

    const handleSubmit = async (dnsServerName: string, dnsServerAddress: string) => {
        const dnsServerAddressError = validateDnsServerAddress(customDnsServers, dnsServerAddress);
        if (dnsServerAddressError) {
            return dnsServerAddressError;
        }
        const normalizedDnsServerAddress = normalizeDnsServerAddress(dnsServerAddress);
        const dnsServer = await settingsStore.addCustomDnsServer(dnsServerName, normalizedDnsServerAddress);
        notificationsStore.notifySuccess(
            translator.getMessage('settings_dns_add_custom_server_notification_success'),
            {
                action: translator.getMessage('settings_exclusions_undo'),
                handler: () => settingsStore.removeCustomDnsServer(dnsServer.id),
            },
        );
        return null;
    };

    return (
        <DnsSettingsServerModal
            title={translator.getMessage('settings_dns_add_custom_server')}
            description={(
                <a href={adguardKnownDnsKbUrl} target="_blank" rel="noreferrer">
                    {translator.getMessage('settings_dns_add_custom_server_info')}
                </a>
            )}
            submitBtnTitle={translator.getMessage('settings_dns_add_custom_server_save_and_select')}
            isOpen={isOpen}
            onSubmit={handleSubmit}
        />
    );
});
